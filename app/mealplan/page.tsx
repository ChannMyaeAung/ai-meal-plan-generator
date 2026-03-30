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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";

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
}

async function generateMealPlan(payload: MealPlanInput): Promise<MealPlanResponse> {
  const response = await fetch("/api/generate-mealplan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Failed to generate meal plan.");
  }
  return data;
}

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

const MealPlanDashboard = () => {
  // null = form not yet submitted; non-null = active query params.
  // Changing this triggers a new query; submitting the same values reuses
  // TanStack Query's in-memory cache (staleTime: Infinity) with no API call.
  const [queryParams, setQueryParams] = useState<MealPlanInput | null>(null);

  const { data, isFetching, isSuccess, isError, error } = useQuery<
    MealPlanResponse,
    Error
  >({
    queryKey: ["mealplan", queryParams],
    queryFn: () => generateMealPlan(queryParams!),
    enabled: queryParams !== null,
    // Never mark this data as stale — identical inputs always serve from cache
    staleTime: Infinity,
    // Don't auto-retry on error; let the user decide to retry
    retry: false,
    // Keep previous results visible while a new query is in-flight
    placeholderData: (prev) => prev,
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setQueryParams({
      dietType: formData.get("dietType")?.toString() ?? "",
      calories: Number(formData.get("calories")),
      allergies: formData.get("allergies")?.toString() ?? "",
      cuisine: formData.get("cuisine")?.toString() ?? "",
      includeSnacks: formData.get("includeSnacks") === "on",
      days: Number(formData.get("days")) || 7,
    });
  }

  const isPending = isFetching;

  return (
    <div className="relative isolate min-h-dvh bg-linear-to-br from-background via-secondary/20 to-card py-16 px-4 sm:px-8">
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
            <span className="rounded-full border border-border bg-card/80 px-3 py-1">Macro-balanced</span>
            <span className="rounded-full border border-border bg-card/80 px-3 py-1">Pantry-aware</span>
            <span className="rounded-full border border-border bg-card/80 px-3 py-1">Prep-light</span>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left Panel: Preferences Form */}
          <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FieldGroup>
                <FieldSet>
                  <FieldLegend className="text-lg text-foreground">
                    Meal Preferences
                  </FieldLegend>
                  <FieldDescription className="text-muted-foreground">
                    Select your dietary preferences and restrictions to customize
                    your meal plan.
                  </FieldDescription>

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="dietType">Diet Type</FieldLabel>
                      <Input
                        type="text"
                        id="dietType"
                        name="dietType"
                        required
                        disabled={isPending}
                        placeholder="e.g. Vegetarian, Vegan, Keto, Mediterranean..."
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="calories">Daily Calorie Goal</FieldLabel>
                      <Input
                        type="number"
                        id="calories"
                        name="calories"
                        min={500}
                        max={15000}
                        required
                        disabled={isPending}
                        placeholder="e.g. 2000"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="allergies">
                        Allergies or Restrictions
                      </FieldLabel>
                      <Input
                        type="text"
                        id="allergies"
                        name="allergies"
                        disabled={isPending}
                        placeholder='e.g. Peanuts, Gluten, Dairy — or "None"'
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="cuisine">Preferred Cuisine</FieldLabel>
                      <Input
                        type="text"
                        id="cuisine"
                        name="cuisine"
                        disabled={isPending}
                        placeholder='e.g. Italian, Mexican, Chinese — or "No Preference"'
                      />
                    </Field>

                    <Field orientation="horizontal">
                      <Checkbox
                        defaultChecked
                        id="includeSnacks"
                        name="includeSnacks"
                        disabled={isPending}
                      />
                      <FieldLabel htmlFor="includeSnacks">Include Snacks</FieldLabel>
                    </Field>
                  </FieldGroup>
                </FieldSet>

                <Field orientation="horizontal" className="justify-start">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-primary text-primary-foreground hover:brightness-95 disabled:opacity-60"
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        Generating...
                      </span>
                    ) : (
                      "Generate Meal Plan"
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </div>

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

            {isError && !isPending && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {error?.message ?? "Something went wrong. Please try again."}
              </div>
            )}

            {data?.mealPlan && isSuccess ? (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {DAYS_OF_WEEK.map((day) => {
                    const mealPlan = data.mealPlan![day];
                    return (
                      <Card
                        key={day}
                        className="relative rounded-xl border border-primary/50 bg-primary/5 p-4 ring-1 ring-primary/40"
                      >
                        <div className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary" />
                        <h3 className="text-lg font-semibold text-foreground">{day}</h3>
                        {mealPlan ? (
                          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium text-foreground">Breakfast:</span>{" "}
                              {mealPlan.Breakfast ?? "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">Lunch:</span>{" "}
                              {mealPlan.Lunch ?? "N/A"}
                            </div>
                            <div>
                              <span className="font-medium text-foreground">Dinner:</span>{" "}
                              {mealPlan.Dinner ?? "N/A"}
                            </div>
                            {mealPlan.Snacks && (
                              <div>
                                <span className="font-medium text-foreground">Snacks:</span>{" "}
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
                    );
                  })}
                </div>
              </ScrollArea>
            ) : isPending ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/80 p-4 text-muted-foreground">
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
                <p className="text-sm text-muted-foreground">
                  Your personalized plan will appear here with meals, snacks, and
                  a smart shopping list.
                </p>
                <div className="rounded-2xl border border-border bg-background/80 p-4 text-muted-foreground text-sm">
                  Generate a plan to see daily breakdowns and grocery-ready items.
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
