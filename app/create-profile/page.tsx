"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

type ApiResponse = {
  message: string;
  error?: string;
};

async function CreateProfileRequest() {
  const response = await fetch("/api/create-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return response.json() as Promise<ApiResponse>;
}

const CreateProfile = () => {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const { mutate, isPending, isError } = useMutation<ApiResponse, Error>({
    mutationFn: CreateProfileRequest,
    onSuccess: () => {
      router.push("/subscribe");
    },
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && !isPending) {
      mutate();
    }
  }, [isLoaded, isSignedIn]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-linear-to-br from-background via-secondary/20 to-card px-4">
      {isError ? (
        <div className="max-w-sm text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">
            Something went wrong
          </p>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t set up your profile. Please try signing in again or
            contact support.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="h-8 w-8 text-primary" />
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">
              Setting up your account
            </p>
            <p className="text-sm text-muted-foreground">
              Just a moment while we get everything ready...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProfile;
