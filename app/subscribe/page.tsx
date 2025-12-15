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
      className={` relative isolate min-h-dvh overflow-hidden bg-linear-to-br from-rose-50 via-amber-50 to-slate-50 px-6 py-12 text-slate-900 dark:from-[#030712] dark:via-[#04050a] dark:to-[#000000] dark:text-slate-100 my-10`}
    >
      <div className="pointer-events-none absolute inset-0 blur-3xl">
        <div className="absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-rose-200/40 dark:bg-rose-500/20" />
        <div className="absolute right-6 bottom-10 h-72 w-72 rounded-full bg-amber-200/40 dark:bg-amber-400/10" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-12">
        <motion.header variants={headerVariants} className="text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-slate-200/70 bg-white/70 px-4 py-1 text-sm font-medium text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Crystal-clear pricing · Cancel anytime
          </div>
          <h1
            className={` mx-auto max-w-3xl text-4xl font-semibold leading-tight text-slate-900 md:text-5xl dark:text-white`}
          >
            Plans that nourish your routine, not drain your budget
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 md:text-lg dark:text-slate-300">
            Choose a cadence that matches your kitchen rhythm. Every plan
            unlocks AI-personalized meal plans, grocery-ready shopping lists,
            and mindful nutrition insights.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-300">
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
              Macro-balanced menus updated weekly
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
              Smart grocery syncing
            </span>
            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
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
                className={`relative overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-6 text-left shadow-xl backdrop-blur-sm transition-shadow dark:border-white/5 dark:bg-white/5 ${
                  plan.isPopular
                    ? "ring-2 ring-amber-400 dark:ring-amber-500"
                    : "hover:shadow-2xl"
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-white/60 to-transparent dark:from-white/10" />
                {plan.isPopular && (
                  <div className="absolute right-6 top-6">
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">
                      Most loved
                    </span>
                  </div>
                )}

                <CardHeader className="relative z-10 space-y-2 p-0">
                  <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-base text-slate-500 dark:text-slate-300">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative z-10 mt-6 flex flex-col gap-6 p-0">
                  <div>
                    <span className="text-4xl font-semibold text-slate-900 dark:text-white">
                      THB {plan.amount}
                    </span>
                    <span className="ml-1 text-sm text-slate-500 dark:text-slate-300">
                      /plan
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full primary-color text-white">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-200">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full rounded-full border-0 px-6 py-5 text-base font-semibold shadow-lg shadow-amber-500/20 transition ${
                      plan.isPopular
                        ? "bg-linear-to-r from-amber-400 via-rose-400 to-amber-500 text-slate-900"
                        : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white/90 dark:text-slate-900"
                    }`}
                    onClick={() => handleSubcribe(plan.interval)}
                    disabled={isPending}
                  >
                    {isPending ? "Processing..." : `Get ${plan.name}`}
                  </Button>

                  <p className="text-xs text-slate-500 dark:text-slate-300">
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
