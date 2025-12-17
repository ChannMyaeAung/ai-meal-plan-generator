"use client";
import { Button } from "@/components/ui/button";
import { availablePlans } from "@/lib/plans";
import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion, type Variants } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 35 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 20,
      stiffness: 160,
      staggerChildren: 0.15,
      delayChildren: 0.15,
    },
  },
};

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 25 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 22, stiffness: 190 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, damping: 19, stiffness: 170 },
  },
};

type SubscribeResponse = {
  url: string;
};

type SubscribeError = {
  error: string;
};

async function subscribeToPlan(
  planType: string,
  userId: string,
  email: string
): Promise<SubscribeResponse> {
  const response = await fetch("api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      planType,
      userId,
      email,
    }),
  });

  if (!response.ok) {
    const errorData: SubscribeError = await response.json();
    throw new Error(errorData.error || "Failed to create checkout session.");
  }

  const data: SubscribeResponse = await response.json();
  return data;
}

const SubscribePage = () => {
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const email = user?.emailAddresses[0]?.emailAddress || "";
  const { mutate, isPending } = useMutation<
    SubscribeResponse,
    Error,
    { planType: string }
  >({
    mutationFn: async ({ planType }) => {
      if (!userId) {
        throw new Error("User not signed in.");
      }

      return subscribeToPlan(planType, userId, email);
    },
    onMutate: () => {
      toast.loading("Processing your subscription...", { id: "subscribe" });
    },
    onSuccess: (data) => {
      toast.success("Redirecting to checkout...", { id: "subscribe" });
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message, { id: "subscribe" });
    },
  });

  function handleSubcribe(planType: string) {
    if (!userId) {
      router.push("/sign-up");
      return;
    }

    mutate({ planType });
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="relative isolate min-h-dvh overflow-hidden bg-linear-to-br from-background via-secondary/25 to-card px-6 py-35 text-foreground"
    >
      <div className="pointer-events-none absolute inset-0 blur-3xl">
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/20" />
        <div className="absolute right-6 bottom-10 h-72 w-72 rounded-full bg-secondary/30" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12">
        <motion.header variants={headerVariants} className="text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-border bg-card/80 px-4 py-1 text-sm font-medium text-foreground shadow-sm">
            Crystal-clear pricing · Cancel anytime
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight text-foreground md:text-5xl">
            Plans that nourish your routine, not drain your budget
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Choose a cadence that matches your kitchen rhythm. Every plan
            unlocks AI-personalized meal plans, grocery-ready shopping lists,
            and mindful nutrition insights.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="rounded-full border border-border bg-card px-4 py-2 shadow-sm">
              Macro-balanced menus updated weekly
            </span>
            <span className="rounded-full border border-border bg-card px-4 py-2 shadow-sm">
              Smart grocery syncing
            </span>
            <span className="rounded-full border border-border bg-card px-4 py-2 shadow-sm">
              Nutritionist-tuned AI
            </span>
          </div>
        </motion.header>

        <motion.section
          variants={containerVariants}
          className="grid gap-8 md:grid-cols-3 place-items-baseline"
        >
          {availablePlans.map((plan, idx) => (
            <motion.div key={idx} variants={cardVariants} className="h-full">
              <Card
                className={`relative overflow-hidden rounded-3xl border border-border bg-card/90 p-6 text-left shadow-xl backdrop-blur-sm transition-shadow ${
                  plan.isPopular ? "ring-2 ring-primary/50" : "hover:shadow-2xl"
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-card/70 to-transparent" />
                {plan.isPopular && (
                  <div className="absolute right-6 top-6">
                    <span className="inline-flex items-center rounded-full bg-primary/15 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
                      Most loved
                    </span>
                  </div>
                )}

                <CardHeader className="relative z-10 space-y-2 p-0">
                  <CardTitle className="text-2xl font-semibold text-foreground">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 mt-6 flex flex-col gap-6 p-0">
                  <div>
                    <span className="text-4xl font-semibold text-foreground">
                      THB {plan.amount}
                    </span>
                    <span className="ml-1 text-sm text-muted-foreground">
                      /plan
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm text-foreground">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full rounded-full border-0 px-6 py-5 text-base font-semibold shadow-lg transition ${
                      plan.isPopular
                        ? "bg-primary text-primary-foreground shadow-primary/30 hover:brightness-95"
                        : "bg-foreground text-background hover:brightness-95"
                    }`}
                    onClick={() => handleSubcribe(plan.interval)}
                    disabled={isPending}
                  >
                    {isPending ? "Processing..." : `Get ${plan.name}`}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Secure checkout · Pause or cancel anytime · Includes
                    AI-powered grocery planning
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>
      </div>
    </motion.div>
  );
};

export default SubscribePage;
