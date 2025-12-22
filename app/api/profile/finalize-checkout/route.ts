import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// POST /api/profile/finalize-checkout lets the client confirm subscription
// state immediately after Stripe redirects back with a session_id. This keeps
// Neon in sync even if webhooks are delayed or misconfigured locally.
export async function POST(req: NextRequest) {
  // Clerk auth gives us the stable profile key that Stripe metadata refers to.
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sessionId: string | undefined;
  try {
    const body = await req.json();
    sessionId = body?.sessionId;
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing Stripe session id" },
      { status: 400 }
    );
  }

  try {
    // Pull the authoritative Stripe session directly so we trust the Stripe
    // record rather than client-supplied values.
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (!session) {
      return NextResponse.json(
        { error: "Stripe session not found" },
        { status: 404 }
      );
    }

    // Ensure the session we retrieved actually belongs to this Clerk user.
    const metadataUserId = session.metadata?.clerkUserId;
    if (metadataUserId && metadataUserId !== userId) {
      return NextResponse.json(
        { error: "Session does not belong to this user" },
        { status: 403 }
      );
    }

    const subscription = session.subscription;
    const stripeSubscriptionId =
      typeof subscription === "string" ? subscription : subscription?.id;

    if (!stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No subscription was created for this session" },
        { status: 400 }
      );
    }

    // We persist the plan metadata Stripe stored during checkout so Neon stays
    // in sync with the plan the customer selected.
    const resolvedTier = session.metadata?.planType || null;
    const email =
      session.customer_details?.email || session.customer_email || "";

    // Upsert instead of update so missing profile rows (e.g., user never hit
    // /create-profile before paying) don't break activation.
    await prisma.profile.upsert({
      where: { userId },
      update: {
        stripeSubscriptionId,
        subscriptionActive: true,
        subscriptionTier: resolvedTier,
      },
      create: {
        userId,
        email,
        stripeSubscriptionId,
        subscriptionActive: true,
        subscriptionTier: resolvedTier,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error finalizing Stripe checkout:", error);
    return NextResponse.json(
      { error: "Unable to finalize checkout" },
      { status: 500 }
    );
  }
}
