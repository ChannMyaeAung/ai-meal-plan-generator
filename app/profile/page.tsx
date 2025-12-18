"use client";
import { Spinner } from "@/components/ui/spinner";
import { availablePlans } from "@/lib/plans";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Toaster } from "react-hot-toast";

const ProfilePage = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const {
    data: subscription,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const response = await fetch("/api/profile/subscription-status");
      return response.json();
    },
    enabled: isLoaded && isSignedIn, // only run if the info is loaded and user is signed in
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // determine current plan details (weekly, monthly, yearly)
  const currentPlan = availablePlans.find(
    (plan) => plan.interval === subscription?.subscription?.subscriptionTier
  );

  if (!isLoaded) {
    return (
      <div>
        <Spinner />
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div>
        <p>Please sing in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:py-35 max-w-7xl mx-auto overflow-hidden">
      <Toaster position="top-center" />
      <div>
        <div>
          <div>
            {user.imageUrl && (
              <Image
                src={user.imageUrl}
                alt="User Profile Image"
                width={100}
                height={100}
              />
            )}
            <h1>
              {user.firstName} {user.lastName}
            </h1>
            <p>{user.primaryEmailAddress?.emailAddress}</p>
          </div>

          <div>
            <h2>Subscription Details</h2>
            {isLoading ? (
              <Spinner />
            ) : isError ? (
              <p>{error?.message}</p>
            ) : subscription ? (
              <div>
                <h3>Current Plan</h3>
                {currentPlan ? (
                  <div>
                    <>
                      <p>
                        <strong>Plan:</strong> {currentPlan.name}
                      </p>
                      <p>
                        <strong>Amount: </strong> {currentPlan.amount}
                        {currentPlan.currency}
                      </p>
                      <p>
                        <strong>Status:</strong> "Active"
                      </p>
                    </>
                  </div>
                ) : (
                  <div></div>
                )}
              </div>
            ) : (
              <p>You are not subscribed to any plan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
