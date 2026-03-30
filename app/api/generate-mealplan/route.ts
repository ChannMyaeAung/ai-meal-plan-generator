import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

interface DailyMealPlan {
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}

// OpenRouter supports up to 3 models in the fallback array.
// Models are on separate provider infrastructure so they won't all
// hit the same upstream rate limit simultaneously.
const FREE_MODEL_FALLBACKS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = [1000, 2000, 4000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Attempt to recover a valid JSON object from a response that was cut off
// mid-stream due to token limits. Walks the string character-by-character,
// tracks brace depth (properly ignoring braces inside strings), and trims
// to the last fully-closed top-level value, then closes the outer object.
function repairTruncatedJSON(raw: string): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let lastCompleteDayEnd = -1; // index of the '}' that closed the last complete day

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (escaped) { escaped = false; continue; }
    if (ch === "\\" && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;

    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      // depth 1 means we just closed a day-level object (outer `{` is depth 0→1,
      // each day value `{` is 1→2, closing it returns to depth 1)
      if (depth === 1) lastCompleteDayEnd = i;
      if (depth === 0) return raw; // already valid
    }
  }

  // JSON was truncated — stitch together everything up to the last complete day
  if (lastCompleteDayEnd > 0) {
    const repaired = raw.slice(0, lastCompleteDayEnd + 1) + "\n}";
    try {
      JSON.parse(repaired);
      return repaired;
    } catch {
      return null;
    }
  }

  return null;
}

async function callOpenRouter(apiKey: string, body: object): Promise<Response> {
  let lastResponse!: Response;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    lastResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
        "X-Title": "AI Meal Plan Generator",
      },
      body: JSON.stringify(body),
    });

    if (lastResponse.status !== 429) return lastResponse;

    const isLastAttempt = attempt === MAX_RETRIES - 1;
    if (!isLastAttempt) {
      console.warn(
        `[generate-mealplan] 429 received, retrying in ${RETRY_DELAY_MS[attempt]}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
      );
      await sleep(RETRY_DELAY_MS[attempt]);
    }
  }

  return lastResponse;
}

// App-level per-user daily caps — separate from OpenRouter's API quota.
// Free users get a taste; subscribers get a comfortable working limit.
const FREE_DAILY_LIMIT = 10;
const SUBSCRIBER_DAILY_LIMIT = 50;

export async function POST(request: Request) {
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server misconfiguration: missing API key." },
      { status: 500 }
    );
  }

  // Rate limiting — enforced per user per calendar day (UTC)
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: {
      subscriptionActive: true,
      dailyGenerationCount: true,
      dailyGenerationResetAt: true,
    },
  });

  const now = new Date();
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const resetAt = profile?.dailyGenerationResetAt;
  const isNewDay = !resetAt || resetAt < todayUTC;
  const currentCount = isNewDay ? 0 : (profile?.dailyGenerationCount ?? 0);
  const limit = profile?.subscriptionActive ? SUBSCRIBER_DAILY_LIMIT : FREE_DAILY_LIMIT;

  if (currentCount >= limit) {
    return NextResponse.json(
      {
        error: `Daily limit of ${limit} meal plans reached. ${
          profile?.subscriptionActive
            ? "Your limit resets tomorrow."
            : "Upgrade to a plan for up to 20 generations per day."
        }`,
      },
      { status: 429 }
    );
  }

  try {
    const { dietType, calories, allergies, cuisine, includeSnacks, days } =
      await request.json();

    // Prompt is deliberately terse — verbose meal descriptions blow through the
    // model's ~4096 output token ceiling before all 7 days are written.
    const prompt = `You are a nutritionist. Return ONLY a raw JSON object — no markdown, no code fences, no commentary.

Create a ${days}-day meal plan: ${dietType} diet, ${calories} kcal/day.
Allergies/restrictions: ${allergies || "none"}.
Cuisine: ${cuisine || "no preference"}.
Snacks: ${includeSnacks ? "yes" : "no"}.

Rules:
- Each key is a day name (Monday … Sunday).
- Each day has keys: "Breakfast", "Lunch", "Dinner"${includeSnacks ? `, "Snacks"` : ""}.
- Each value is a SHORT string: meal name and approximate calories only. Example: "Oatmeal with banana – 350 kcal"
- No extra keys, no explanations, no nested objects.

Output format:
{"Monday":{"Breakfast":"...","Lunch":"...","Dinner":"..."${includeSnacks ? `,"Snacks":"..."` : ""}},"Tuesday":{...},...}`;

    const aiResponse = await callOpenRouter(apiKey, {
      models: FREE_MODEL_FALLBACKS,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8000,
    });

    const aiData = await aiResponse.json();

    if (!aiResponse.ok || aiData.error) {
      const code = aiData.error?.code ?? aiResponse.status;
      const message = aiData.error?.message ?? "Unknown error from AI provider.";
      console.error("[generate-mealplan] OpenRouter error:", { code, message });

      if (code === 429) {
        return NextResponse.json(
          { error: "All free AI models are currently busy. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `AI provider error: ${message}` },
        { status: 502 }
      );
    }

    const rawContent = aiData.choices?.[0]?.message?.content?.trim() ?? "";

    // Strip markdown code fences in case the model ignores our instructions
    const cleanedContent = rawContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsedMealPlan: { [day: string]: DailyMealPlan } | null = null;

    // First attempt: parse as-is
    try {
      parsedMealPlan = JSON.parse(cleanedContent);
    } catch {
      // Second attempt: try to recover from token-limit truncation
      console.warn("[generate-mealplan] JSON parse failed, attempting repair...");
      const repaired = repairTruncatedJSON(cleanedContent);
      if (repaired) {
        try {
          parsedMealPlan = JSON.parse(repaired);
          console.warn("[generate-mealplan] Recovered partial meal plan from truncated response.");
        } catch {
          // repair also failed — fall through to error response
        }
      }
    }

    if (!parsedMealPlan || typeof parsedMealPlan !== "object") {
      console.error("[generate-mealplan] Could not parse response:", { cleanedContent });
      return NextResponse.json(
        { error: "Failed to parse the meal plan. Please try again." },
        { status: 500 }
      );
    }

    // Only count successful generations against the daily limit
    await prisma.profile.update({
      where: { userId },
      data: {
        dailyGenerationCount: currentCount + 1,
        ...(isNewDay && { dailyGenerationResetAt: todayUTC }),
      },
    });

    return NextResponse.json({ mealPlan: parsedMealPlan }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[generate-mealplan] Unexpected error:", message);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
