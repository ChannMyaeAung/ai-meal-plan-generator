import { NextResponse } from "next/server";
import OpenAI from "openai";
const openAI = new OpenAI({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Shape for each day's meals when we parse the AI response
interface DailyMealPlan {
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}

export async function POST(request: Request) {
  try {
    // Grab the user-sent JSON body from the request
    const { dietType, calories, allergies, cuisine, includeSnacks, days } =
      await request.json();

    // Build a prompt that asks the model for a JSON meal plan
    const prompt = `
      You are a professional nutritionist. Create a ${days}-day meal plan for an individual following a ${dietType} diet aiming for ${calories} calories per day.
      
      Allergies or restrictions: ${allergies || "none"}.
      Preferred cuisine: ${cuisine || "no preference"}.
      Snacks included: ${includeSnacks ? "yes" : "no"}.
      
      For each day, provide:
        - Breakfast
        - Lunch
        - Dinner
        ${includeSnacks ? "- Snacks" : ""}
      
      Use simple ingredients and provide brief instructions. Include approximate calorie counts for each meal.
      
      Structure the response as a JSON object where each day is a key, and each meal (breakfast, lunch, dinner, snacks) is a sub-key. Example:
      
      {
        "Monday": {
          "Breakfast": "Oatmeal with fruits - 350 calories",
          "Lunch": "Grilled chicken salad - 500 calories",
          "Dinner": "Steamed vegetables with quinoa - 600 calories",
          "Snacks": "Greek yogurt - 150 calories"
        },
        "Tuesday": {
          "Breakfast": "Smoothie bowl - 300 calories",
          "Lunch": "Turkey sandwich - 450 calories",
          "Dinner": "Baked salmon with asparagus - 700 calories",
          "Snacks": "Almonds - 200 calories"
        }
        // ...and so on for each day
      }

      Return only a JSON object. Do not include code fences, markdown, commentary, or keys other than the days and meals.
    `;

    // Send the prompt to the AI model
    const response = await openAI.chat.completions.create({
      model: "meta-llama/llama-3.2-3b-instruct:free",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7, // Adjust for creativity vs. consistency
      max_completion_tokens: 1500, // Adjust based on expected response length
    });

    // Raw text returned by the model (may include code fences)
    const aiContent = response.choices[0].message.content?.trim() ?? "";

    // Strip markdown code fences/backticks so JSON.parse won't fail on fenced outputs
    // aka sanitize the AI output into plain JSON so parsing doesn't fail when the model includes code fences ... ```
    const cleanedContent = aiContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Attempt to parse the AI's response as JSON after cleaning
    let parsedMealPlan: { [day: string]: DailyMealPlan };
    try {
      parsedMealPlan = JSON.parse(cleanedContent);
    } catch (e) {
      console.error("Error parsing AI response:", e, {
        aiContent,
        cleanedContent,
      });
      return NextResponse.json(
        {
          error: "Failed to parse meal plan from AI response.",
          raw: cleanedContent,
        },
        { status: 500 }
      );
    }
    if (typeof parsedMealPlan !== "object" || parsedMealPlan === null) {
      return NextResponse.json(
        { error: "Invalid meal plan format received from AI." },
        { status: 500 }
      );
    }

    return NextResponse.json({ mealPlan: parsedMealPlan }, { status: 200 });
  } catch (error) {
    return NextResponse.json("Internal Server Error", { status: 500 });
  }
}
