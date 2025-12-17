"use client";
import { Button } from "@/components/ui/button";
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
import React from "react";

interface MealPlanInput {
  dietType: string;
  calories: number;
  allergies: string;
  cuisine: string;
  includeSnacks: boolean;
  days?: number;
}

const MealPlanDashboard = () => {
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

    console.log("Form submitted with data:", payload);
  }

  return (
    <div className="relative isolate min-h-dvh h-full bg-linear-to-br from-background via-secondary/20 to-card py-35 px-4 sm:px-8">
      <div className="pointer-events-none absolute inset-0 blur-3xl">
        <div className="absolute left-10 top-16 h-64 w-64 rounded-full bg-primary/20" />
        <div className="absolute right-4 bottom-12 h-72 w-72 rounded-full bg-secondary/30" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10">
        <header className="space-y-3 text-center">
          <p className="mx-auto inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-1 text-sm font-medium text-foreground shadow-sm">
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
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
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

                    {/* Number of Days */}
                    <Field>
                      <FieldLabel htmlFor="days">Number of Days</FieldLabel>
                      <Input
                        type="number"
                        id="days"
                        name="days"
                        min={1}
                        max={30}
                        required
                        placeholder="e.g. 7"
                      />
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <Field orientation="horizontal" className="justify-end">
                  <Button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:brightness-95"
                  >
                    Generate Meal Plan
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </div>

          {/* Right Panel: Weekly Meal Plan Display */}
          <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-foreground">
              Weekly Meal Plan
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your personalized plan will appear here with meals, snacks, and a
              smart shopping list.
            </p>
            <div className="mt-6 rounded-2xl border border-border bg-background/80 p-4 text-muted-foreground">
              Generate a plan to see daily breakdowns and grocery-ready items.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlanDashboard;
