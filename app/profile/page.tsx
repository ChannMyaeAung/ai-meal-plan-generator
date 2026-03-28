"use client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { availablePlans } from "@/lib/plans";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { BadgeCheck, CreditCard, ShieldAlert } from "lucide-react";

async function fetchSubscriptionStatus() {
  const response = await fetch("/api/profile/subscription-status");
  return response.json();
}

async function updatePlan(newPlan: string) {
  const response = await fetch("/api/profile/change-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newPlan }),
  });
  return response.json();
}

async function cancelSubscription() {
  const response = await fetch("/api/profile/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return response.json();
}

const ProfilePage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const { isLoaded, isSignedIn, user } = useUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: subscription,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscriptionStatus,
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: updatePlanMutation, isPending: isUpdatePlanPending } =
    useMutation({
      mutationFn: updatePlan,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        toast.success("Subscription plan updated successfully.");
        refetch();
      },
      onError: () => {
        toast.error("Failed to update subscription plan.");
      },
    });

  const { mutate: unsubscribeMutation, isPending: isUnsubscribePending } =
    useMutation({
      mutationFn: cancelSubscription,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["subscription"] });
        router.push("/subscribe");
      },
      onError: () => {
        toast.error("Failed to cancel subscription plan.");
      },
    });

  const currentPlan = availablePlans.find(
    (plan) => plan.interval === subscription?.subscription?.subscriptionTier
  );

  function handleUpdatePlan() {
    if (selectedPlan) updatePlanMutation(selectedPlan);
    setSelectedPlan("");
  }

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center gap-3 text-muted-foreground">
        <Spinner />
        <span>Loading...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Please sign in to view your profile.</p>
      </div>
    );
  }

  const initials =
    user.firstName && user.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`
      : user.firstName?.[0] ?? "U";

  const isSubscriptionActive = subscription?.subscription?.subscriptionActive;

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-linear-to-br from-background via-secondary/20 to-card">
      <div className="pointer-events-none absolute inset-0 blur-3xl">
        <div className="absolute left-10 top-20 h-64 w-64 rounded-full bg-primary/15" />
        <div className="absolute right-6 bottom-16 h-72 w-72 rounded-full bg-secondary/25" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 space-y-8">
        {/* Profile header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 rounded-3xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur-sm">
          {user.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt="Profile photo"
              width={80}
              height={80}
              className="h-20 w-20 rounded-full ring-2 ring-primary/30"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-2xl font-bold text-primary ring-2 ring-primary/30">
              {initials}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user.primaryEmailAddress?.emailAddress}
            </p>
            {isSubscriptionActive && (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <BadgeCheck className="h-3.5 w-3.5" />
                Active Subscriber
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
          {/* Subscription Details */}
          <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur-sm space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Subscription Details
              </h2>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Spinner className="h-4 w-4" />
                <span className="text-sm">Loading subscription...</span>
              </div>
            ) : isError ? (
              <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error?.message ?? "Failed to load subscription."}
              </p>
            ) : currentPlan ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Plan</p>
                    <p className="mt-1 font-semibold text-foreground">{currentPlan.name}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {currentPlan.amount} {currentPlan.currency}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Billing</p>
                    <p className="mt-1 font-semibold text-foreground capitalize">
                      {currentPlan.interval}ly
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                    <p className={`mt-1 font-semibold ${isSubscriptionActive ? "text-primary" : "text-destructive"}`}>
                      {isSubscriptionActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-background/60 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">No active subscription found.</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => router.push("/subscribe")}
                >
                  View Plans
                </Button>
              </div>
            )}
          </div>

          {/* Change Plan */}
          {currentPlan && (
            <div className="rounded-3xl border border-border bg-card/90 p-6 shadow-lg backdrop-blur-sm space-y-4 min-w-[260px]">
              <h2 className="text-lg font-semibold text-foreground">Manage Plan</h2>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Switch plan</p>
                <Select
                  defaultValue={currentPlan.interval}
                  disabled={isUpdatePlanPending}
                  onValueChange={(value) => setSelectedPlan(value)}
                >
                  <SelectTrigger className="w-full border-border">
                    <SelectValue placeholder={currentPlan.interval} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {availablePlans.map((plan) => (
                        <SelectItem key={plan.interval} value={plan.interval}>
                          {plan.name} — THB {plan.amount}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleUpdatePlan}
                  disabled={isUpdatePlanPending || !selectedPlan || selectedPlan === currentPlan.interval}
                  className="w-full"
                >
                  {isUpdatePlanPending ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" />
                      Updating...
                    </span>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>

              <div className="border-t border-border pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={isUnsubscribePending}
                    >
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Cancel Subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You will keep access until the end of your current billing
                        period. After that, AI meal plan generation will be
                        unavailable.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => unsubscribeMutation()}
                        disabled={isUnsubscribePending}
                        className="bg-destructive text-foreground hover:bg-destructive/90"
                      >
                        {isUnsubscribePending ? (
                          <span className="flex items-center gap-2">
                            <Spinner className="h-4 w-4" />
                            Canceling...
                          </span>
                        ) : (
                          "Yes, Cancel"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
