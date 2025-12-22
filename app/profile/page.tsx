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
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

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

async function cancelSubscription() {
  const response = await fetch("/api/profile/unsubscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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

  const {
    data: updatedPlan,
    mutate: updatePlanMutation,
    isPending: isUpdatePlanPending,
  } = useMutation({
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

  const {
    data: canceledPlan,
    mutate: unsubscribeMutation,
    isPending: isUnsubscribePending,
  } = useMutation({
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
    if (selectedPlan) {
      updatePlanMutation(selectedPlan);
    }

    setSelectedPlan("");
  }

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
    <div className="min-h-screen px-4 py-8 max-w-7xl mx-auto overflow-hidden space-y-4">
      <Toaster position="top-center" />
      <div className="">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
      </div>
      <div className="grid gap-12 sm:grid-cols-[1.5fr_1fr]">
        {/* Subscription Details */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>
          {isLoading ? (
            <Spinner />
          ) : isError ? (
            <p className="text-red-500">{error?.message}</p>
          ) : subscription ? (
            <div className="bg-card border border-ring rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4 text-primary">
                Current Plan
              </h3>
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

        {/* Change Subscription Plan */}
        <div className="space-y-4">
          {currentPlan && (
            <>
              <h2 className="text-xl font-semibold mb-4">
                Change Subscription Plan
              </h2>
              <Select
                defaultValue={currentPlan?.interval}
                disabled={isUpdatePlanPending}
                onValueChange={(value: string) => setSelectedPlan(value)}
              >
                <SelectTrigger className="w-[280px] border-ring">
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
              <Button onClick={handleUpdatePlan} className="cursor-pointer">
                Save Changes
              </Button>
              {isUpdatePlanPending && (
                <div>
                  {" "}
                  <Spinner /> Updating Plan...
                </div>
              )}

              <div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant={"destructive"}
                      className="cursor-pointer hover:bg-destructive/70"
                    >
                      Cancel Subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to cancel your subscription?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You will lose access to premium features at the end of
                        your billing cycle.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => unsubscribeMutation()}
                        disabled={isUnsubscribePending}
                        className="bg-destructive text-foreground hover:bg-destructive/90 cursor-pointer"
                      >
                        {isUnsubscribePending
                          ? "Canceling Subscription..."
                          : "Cancel Subscription"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
