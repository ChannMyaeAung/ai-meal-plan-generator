import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

interface DailyMealPlan {
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------

// Groq: OpenAI-compatible, ~14,400 req/day free, very fast inference.
// Sign up at console.groq.com — free, no credit card required.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

// OpenRouter: fallback provider when GROQ_API_KEY is not set.
// Free tier is 50 req/day (account-wide); add $10 credits for 1,000/day.
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_FREE_MODELS = [
  "nvidia/nemotron-3-super-120b-a12b:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
];

// ---------------------------------------------------------------------------
// Retry logic
// ---------------------------------------------------------------------------

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = [1000, 2000, 4000];

// Transient errors worth retrying — provider is temporarily unavailable or
// rate-limited (we back off and try again rather than failing immediately).
const RETRIABLE_STATUSES = new Set([429, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callWithRetry(
  url: string,
  headers: Record<string, string>,
  body: object,
  providerName: string
): Promise<Response> {
  let lastResponse!: Response;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    lastResponse = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!RETRIABLE_STATUSES.has(lastResponse.status)) return lastResponse;

    const isLastAttempt = attempt === MAX_RETRIES - 1;
    if (!isLastAttempt) {
      console.warn(
        `[generate-mealplan] ${providerName} ${lastResponse.status}, retrying in ${RETRY_DELAY_MS[attempt]}ms (attempt ${attempt + 1}/${MAX_RETRIES})`
      );
      await sleep(RETRY_DELAY_MS[attempt]);
    }
  }

  return lastResponse;
}

// Tries Groq first (if GROQ_API_KEY is set), then falls back to OpenRouter.
async function callAIProvider(messages: object[]): Promise<Response> {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return callWithRetry(
      GROQ_URL,
      { Authorization: `Bearer ${groqKey}`, "Content-Type": "application/json" },
      { model: GROQ_MODEL, messages, temperature: 0.7, max_tokens: 8000 },
      "Groq"
    );
  }

  const openRouterKey = process.env.OPEN_ROUTER_API_KEY;
  if (openRouterKey) {
    return callWithRetry(
      OPENROUTER_URL,
      {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
        "X-Title": "AI Meal Plan Generator",
      },
      // `models` array = OpenRouter-specific provider fallback (max 3)
      { models: OPENROUTER_FREE_MODELS, messages, temperature: 0.7, max_tokens: 8000 },
      "OpenRouter"
    );
  }

  throw new Error("No AI provider configured. Set GROQ_API_KEY or OPEN_ROUTER_API_KEY.");
}

// ---------------------------------------------------------------------------
// JSON repair helper
// ---------------------------------------------------------------------------

// Attempt to recover a valid JSON object from a response cut off mid-stream
// due to token limits. Walks char-by-char, tracks brace depth (ignoring
// braces inside strings), trims to the last fully-closed day, closes outer.
function repairTruncatedJSON(raw: string): string | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let lastCompleteDayEnd = -1;

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
      if (depth === 1) lastCompleteDayEnd = i;
      if (depth === 0) return raw; // already valid
    }
  }

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

// ---------------------------------------------------------------------------
// App-level rate limiting (per user, per day)
// ---------------------------------------------------------------------------

const FREE_DAILY_LIMIT = 10;
const SUBSCRIBER_DAILY_LIMIT = 50;

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // Verify at least one AI provider is configured
  if (!process.env.GROQ_API_KEY && !process.env.OPEN_ROUTER_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfiguration: no AI provider API key set." },
      { status: 500 }
    );
  }

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
            : "Upgrade to a plan for more daily generations."
        }`,
      },
      { status: 429 }
    );
  }

  try {
    const { dietType, calories, allergies, cuisine, includeSnacks, days } =
      await request.json();

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

    const aiResponse = await callAIProvider([{ role: "user", content: prompt }]);

    let aiData: Record<string, unknown>;
    try {
      aiData = await aiResponse.json();
    } catch {
      console.error("[generate-mealplan] Non-JSON response, status:", aiResponse.status);
      return NextResponse.json(
        { error: "AI provider returned an unexpected response. Please try again." },
        { status: 502 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aiAny = aiData as any;

    if (!aiResponse.ok || aiAny.error) {
      const code = aiAny.error?.code ?? aiResponse.status;
      const message = aiAny.error?.message ?? "Unknown error from AI provider.";
      console.error("[generate-mealplan] Provider error:", { code, message });

      if (code === 429) {
        return NextResponse.json(
          { error: "AI provider is rate-limited. Please wait a moment and try again." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `AI provider error: ${message}` },
        { status: 502 }
      );
    }

    const rawContent: string = aiAny.choices?.[0]?.message?.content?.trim() ?? "";

    const cleanedContent = rawContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsedMealPlan: { [day: string]: DailyMealPlan } | null = null;

    try {
      parsedMealPlan = JSON.parse(cleanedContent);
    } catch {
      console.warn("[generate-mealplan] JSON parse failed, attempting repair...");
      const repaired = repairTruncatedJSON(cleanedContent);
      if (repaired) {
        try {
          parsedMealPlan = JSON.parse(repaired);
          console.warn("[generate-mealplan] Recovered partial meal plan.");
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
