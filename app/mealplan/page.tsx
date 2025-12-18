"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemMedia } from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import React from "react";

interface MealPlanInput {
  dietType: string;
  calories: number;
  allergies: string;
  cuisine: string;
  includeSnacks: boolean;
  days?: number;
}

interface DailyMealPlan {
  Breakfast?: string;
  Lunch?: string;
  Dinner?: string;
  Snacks?: string;
}

interface WeeklyMealPlan {
  [day: string]: DailyMealPlan;
}

interface MealPlanResponse {
  mealPlan?: WeeklyMealPlan;
  error?: string;
}

async function generateMealPlan(payload: MealPlanInput) {
  const response = await fetch("api/generate-mealplan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return response.json();
}

const MealPlanDashboard = () => {
  const { mutate, isPending, data, isSuccess } = useMutation<
    MealPlanResponse,
    Error,
    MealPlanInput
  >({
    mutationFn: generateMealPlan,
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const dietType = formData.get("dietType") as string;
    const payload: MealPlanInput = {
      dietType: formData.get("dietType")?.toString() || "",
      calories: Number(formData.get("calories")),
      allergies: formData.get("allergies")?.toString() || "",
      cuisine: formData.get("cuisine")?.toString() || "",
      includeSnacks: formData.get("includeSnacks") === "on",
      days: Number(formData.get("days")) || 7,
    };

    mutate(payload);
  }

  const daysOfTheWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const getMealPlanForDay = (day: string): DailyMealPlan | undefined => {
    return data?.mealPlan ? data.mealPlan[day] : undefined;
  };

  return (
    <div className="relative isolate min-h-dvh h-full bg-linear-to-br from-background via-secondary/20 to-card py-35 px-4 sm:px-8">
      <div className="pointer-events-none absolute inset-0 blur-3xl">
        <div className="absolute left-10 top-16 h-64 w-64 rounded-full bg-primary/20" />
        <div className="absolute right-4 bottom-12 h-72 w-72 rounded-full bg-secondary/30" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10">
        <header className="space-y-4 text-center">
          <p className="mx-auto inline-flex items-center rounded-full border border-border bg-card/90 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/80 shadow-sm">
            Tailor each week to your goals
          </p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            AI Meal Plan Generator
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Share your dietary needs, calorie target, and favorite cuisines. We
            will generate a balanced plan and keep snacks in the loop when you
            want them.
          </p>
          <div className="mx-auto flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-card/80 px-3 py-1">
              Macro-balanced
            </span>
            <span className="rounded-full border border-border bg-card/80 px-3 py-1">
              Pantry-aware
            </span>
            <span className="rounded-full border border-border bg-card/80 px-3 py-1">
              Prep-light
            </span>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left Panel: Meal Preferences Form */}
          <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FieldGroup>
                <FieldSet>
                  <FieldLegend className="text-lg text-foreground">
                    Meal Preferences
                  </FieldLegend>
                  <FieldDescription className="text-muted-foreground">
                    Select your dietary preferences and restrictions to
                    customize your meal plan.
                  </FieldDescription>
                  {/* Inputs */}
                  <FieldGroup>
                    {/* Diet Type */}
                    <Field>
                      <FieldLabel htmlFor="dietType">Diet Type</FieldLabel>
                      <Input
                        type="text"
                        id="dietType"
                        name="dietType"
                        required
                        placeholder="e.g. Vegetarian, Vegan, Keto, Mediterranean..."
                      />
                    </Field>

                    {/* Calories */}
                    <Field>
                      <FieldLabel htmlFor="calories">
                        Daily Calorie Goal
                      </FieldLabel>
                      <Input
                        type="number"
                        id="calories"
                        name="calories"
                        min={500}
                        max={15000}
                        required
                        placeholder="e.g. 2000"
                      />
                    </Field>

                    {/* Allergies or Restrictions */}
                    <Field>
                      <FieldLabel htmlFor="allergies">
                        Allergies or Restrictions
                      </FieldLabel>
                      <Input
                        type="text"
                        id="allergies"
                        name="allergies"
                        required
                        placeholder="e.g. Peanuts, Gluten, Dairy..."
                      />
                    </Field>

                    {/* Preferred Cuisine */}
                    <Field>
                      <FieldLabel htmlFor="cuisine">
                        Preferred Cuisine
                      </FieldLabel>
                      <Input
                        type="text"
                        id="cuisine"
                        name="cuisine"
                        required
                        placeholder="e.g. Italian, Mexican, Chinese, No Preference..."
                      />
                    </Field>

                    {/* Include Snacks */}
                    <Field orientation="horizontal">
                      <Checkbox
                        defaultChecked
                        id="includeSnacks"
                        name="includeSnacks"
                      />
                      <FieldLabel htmlFor="includeSnacks">
                        Include Snacks
                      </FieldLabel>
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <Field orientation="horizontal" className="justify-start">
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:brightness-95"
                  >
                    {isPending ? "Generating..." : "Generate Meal Plan"}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </div>

          {/* Right Panel: Weekly Meal Plan Display */}
          {/* Right Panel: Weekly Meal Plan Display */}
          <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-lg space-y-6">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  Weekly Meal Plan
                </h2>
                <p className="text-sm text-muted-foreground">
                  Day-by-day meals once generated.
                </p>
              </div>

              {isPending && (
                <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                  Generating...
                </span>
              )}
            </div>

            {data?.mealPlan && isSuccess ? (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {daysOfTheWeek.map((day) => {
                    const mealPlan = getMealPlanForDay(day);

                    return (
                      <button
                        key={day}
                        type="button"
                        className="group w-full text-left focus-visible:outline-none"
                      >
                        <Card className="relative rounded-xl border p-4 transition-all  focus-visible:ring-2 focus-visible:ring-ring border-primary/50 ring-1 ring-primary/40 bg-primary/5">
                          {/* Status Dot */}
                          <div className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary" />

                          <h3 className="text-lg font-semibold text-foreground">
                            {day}
                          </h3>

                          {mealPlan ? (
                            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium text-foreground">
                                  Breakfast:
                                </span>{" "}
                                {mealPlan.Breakfast || "N/A"}
                              </div>

                              <div>
                                <span className="font-medium text-foreground">
                                  Lunch:
                                </span>{" "}
                                {mealPlan.Lunch || "N/A"}
                              </div>

                              <div>
                                <span className="font-medium text-foreground">
                                  Dinner:
                                </span>{" "}
                                {mealPlan.Dinner || "N/A"}
                              </div>

                              {mealPlan.Snacks && (
                                <div>
                                  <span className="font-medium text-foreground">
                                    Snacks:
                                  </span>{" "}
                                  {mealPlan.Snacks}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">
                              No data for this day.
                            </p>
                          )}
                        </Card>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : isPending ? (
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-background/80 p-4 text-muted-foreground">
                <Spinner />
                <div>
                  <p className="font-medium text-foreground">
                    Generating your personalized meal plan...
                  </p>
                  <p className="text-sm">This may take a few seconds.</p>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your personalized plan will appear here with meals, snacks,
                  and a smart shopping list.
                </p>
                <div className="mt-6 rounded-2xl border border-border bg-background/80 p-4 text-muted-foreground">
                  Generate a plan to see daily breakdowns and grocery-ready
                  items.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanDashboard;
