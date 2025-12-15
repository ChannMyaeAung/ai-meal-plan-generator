export interface Plan {
  name: string;
  amount: number;
  currency: string;
  interval: string;
  isPopular?: boolean;
  description: string;
  features: string[];
}

export const availablePlans: Plan[] = [
  {
    name: "Weekly Plan",
    amount: 99,
    currency: "THB",
    interval: "week",
    isPopular: false,
    description:
      "Perfect for trying the AI Meal Planner with zero long-term commitment.",
    features: [
      "Unlimited AI-generated meal plans",
      "Smart grocery list",
      "Daily calorie & macro insights",
      "Cancel anytime",
    ],
  },
  {
    name: "Monthly Plan",
    amount: 349,
    currency: "THB",
    interval: "month",
    isPopular: true,
    description:
      "Best value for consistent meal planning and nutrition tracking.",
    features: [
      "Everything in Weekly Plan",
      "AI habit tracking & recommendations",
      "Save and reuse custom meal plans",
      "Priority meal plan generation",
    ],
  },
  {
    name: "Annual Plan",
    amount: 6999,
    currency: "THB",
    interval: "year",
    isPopular: false,
    description:
      "Ideal for users committed to long-term health improvements with smart AI features.",
    features: [
      "Everything in Monthly Plan",
      "Personalized long-term nutrition insights",
      "Exclusive early access to new features",
      "Two free AI health reports per year",
    ],
  },
];

const priceIDMap: Record<string, string> = {
  week: process.env.STRIPE_PRICE_WEEKLY!,
  month: process.env.STRIPE_PRICE_MONTHLY!,
  year: process.env.STRIPE_PRICE_ANNUAL!,
};

// Function to get Price ID based on plan type (week, month, year)
export const getPriceIDFromType = (planType: string) => priceIDMap[planType];
