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
import { useMutation, useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Toaster } from "react-hot-toast";

async function fetchSubscriptionStatus() {
  const response = await fetch("/api/profile/subscription-status");
  return response.json();
}

async function updatePlan(newPlan: string) {
  const response = await fetch("/api/profile/change-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ newPlan }),
  });
  return response.json();
}

const ProfilePage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const {
    data: subscription,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["subscription"],
    queryFn: fetchSubscriptionStatus,
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: updatedPlan,
    mutate: updatePlanMutation,
    isPending: isUpdatePlanPending,
  } = useMutation({
    mutationFn: updatePlan,
  });

  const currentPlan = availablePlans.find(
    (plan) => plan.interval === subscription?.subscription?.subscriptionTier
  );

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
        <p className="ml-2">Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:py-35 max-w-7xl mx-auto overflow-hidden">
      <Toaster position="top-center" />
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          {user.imageUrl && (
            <Image
              src={user.imageUrl}
              alt="User Profile Image"
              width={100}
              height={100}
              className="rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-muted-foreground">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>
          {isLoading ? (
            <Spinner />
          ) : isError ? (
            <p className="text-red-500">{error?.message}</p>
          ) : subscription ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Current Plan</h3>
              {currentPlan ? (
                <div className="space-y-2">
                  <p>
                    <strong>Plan:</strong> {currentPlan.name}
                  </p>
                  <p>
                    <strong>Amount: </strong> {currentPlan.amount}{" "}
                    {currentPlan.currency}
                  </p>
                  {subscription.subscription?.subscriptionTier && (
                    <p>
                      <strong>Tier:</strong>{" "}
                      {subscription.subscription.subscriptionTier}
                    </p>
                  )}
                  {subscription.subscription?.subscriptionActive !==
                  undefined ? (
                    <p>
                      <strong>Status:</strong>
                      {subscription.subscription.subscriptionActive
                        ? " Active"
                        : " Inactive"}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p>No active plan found.</p>
              )}
            </div>
          ) : (
            <p>You are not subscribed to any plan.</p>
          )}
        </div>
      </div>
      <div>
        <h3>Change Subscription Plan</h3>
        {currentPlan && (
          <>
            <Select
              defaultValue={currentPlan?.interval}
              disabled={isUpdatePlanPending}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder={currentPlan.interval} />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {availablePlans.map((plan, key) => (
                    <SelectItem key={key} value={plan.interval}>
                      {plan.name} - THB {plan.amount} / {plan.interval}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button>Save Changes</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
