import { getPriceIDFromType } from "@/lib/plans";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Confirm we know which user is making the request via Clerk
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json(
        {
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    // Pull the requested plan change from the request body
    const { newPlan } = await req.json();

    if (!newPlan) {
      return NextResponse.json(
        { error: "New plan is required." },
        { status: 400 }
      );
    }

    // Look up this user's profile so we can adjust the stored plan metadata
    const profile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found." },
        { status: 404 }
      );
    }

    if (!profile.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found." },
        { status: 400 }
      );
    }

    const subscriptionId = profile.stripeSubscriptionId;

    // Grab the active subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subscriptionItemId = subscription.items.data[0]?.id;
    if (!subscriptionItemId) {
      return NextResponse.json(
        { error: "Subscription not found in Stripe." },
        { status: 404 }
      );
    }

    // Tell Stripe to swap the plan immediately (with proration)
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
        items: [
          {
            id: subscriptionItemId,
            price: getPriceIDFromType(newPlan),
          },
        ],
        // Bill the difference between old/new plans immediately
        proration_behavior: "create_prorations",
      }
    );

    // Mirror the change in our database so the UI stays in sync
    await prisma.profile.update({
      where: { userId: clerkUser.id },
      data: {
        subscriptionTier: newPlan,
        stripeSubscriptionId: updatedSubscription.id,
        subscriptionActive: true,
      },
    });

    return NextResponse.json(
      { subscription: updatedSubscription },
      { status: 200 }
    );
  } catch (error) {
    // Fall back to a generic message so we don't leak sensitive details
    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
