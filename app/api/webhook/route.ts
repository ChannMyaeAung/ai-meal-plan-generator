import prisma from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// POST /api/webhook receives Stripe events (checkout completion, subscription
// changes, payment failures, etc.) so we can update our database even if the
// client never returns after paying.
export async function POST(req: NextRequest) {
  // Read the raw body to let Stripe verify its signature.
  const body = await req.text();

  // Retrieve the Stripe signature from headers for validation.
  const signature = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature || "",
      webhookSecret
    );
  } catch (error: any) {
    // Early return if Stripe tells us the payload was tampered with.
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case "invoice.payment_failed": {
        const session = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(session);
        break;
      }
      case "customer.subscription.deleted": {
        const session = event.data.object as Stripe.Subscription;
        await handleCustomerSubscriptionDeleted(session);
        break;
      }
      default: {
        console.log(`Unhandled event type ${event.type}`);
      }
    }
  } catch (error) {
    console.error("Error handling webhook event:", error);
  }

  return NextResponse.json({ received: true });
}

// Make calls to our postgres database, and we wanna update
// the fields: subscriptionActive (T/F), subscriptionTier, stripeSubscriptionId
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.clerkUserId;
  if (!userId) {
    console.log("No Clerk user ID found in session metadata.");
    return;
  }

  // Retrieve subsciription ID from the checkout session
  const subscriptionId = session.subscription as string;

  if (!subscriptionId) {
    console.log("No subscription ID found in checkout session.");
    return;
  }

  // Update Primsa with subscription details
  try {
    await prisma.profile.update({
      where: { userId },
      data: {
        stripeSubscriptionId: subscriptionId,
        subscriptionActive: true,
        subscriptionTier: session.metadata?.planType || null,
      },
    });
  } catch (error) {
    console.error("Error updating profile after checkout:", error);
  }
}

type InvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

// Handler for failed invoice payments
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionField = (invoice as InvoiceWithSubscription).subscription;
  const subId =
    typeof subscriptionField === "string"
      ? subscriptionField
      : subscriptionField?.id;
  if (!subId) {
    console.log("No subscription ID found in invoice.");
    return;
  }

  // Retrieve userId from subscription ID
  let userId: string | undefined;
  try {
    const profile = await prisma.profile.findUnique({
      where: { stripeSubscriptionId: subId },
      select: {
        userId: true,
      },
    });

    if (!profile?.userId) {
      console.log("No profile found for subscription ID:", subId);
      return;
    }

    userId = profile.userId;
  } catch (error) {
    console.error("Error retrieving subscription from Stripe:", error);
    return;
  }

  // if the invoice failed, then we don't want to set subscriptionActive to be true, we wanna set to false
  // Update Prisma with payment failure
  try {
    await prisma.profile.update({
      where: { userId },
      data: {
        subscriptionActive: false,
      },
    });
  } catch (error) {
    console.error(
      "Error updating profile after invoice payment failed:",
      error
    );
  }
}

// Handler for subscription deletions (e.g., cancellations)
async function handleCustomerSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  const subId = subscription.id;

  // Retrieve userId from subscription ID
  let userId: string | undefined;

  try {
    const profile = await prisma.profile.findUnique({
      where: { stripeSubscriptionId: subId },
      select: { userId: true },
    });
    if (!profile?.userId) {
      console.log("No profile found for subscription ID:", subId);
      return;
    }

    userId = profile.userId;
  } catch (error) {
    console.error("Error retrieving subscription from Stripe:", error);
    return;
  }

  try {
    await prisma.profile.update({
      where: { userId },
      data: {
        subscriptionActive: false,
        stripeSubscriptionId: null,
        subscriptionTier: null,
      },
    });
    console.log(`Subscription canceled for user: ${userId}`);
  } catch (error) {
    console.error("Error updating profile after subscription deletion:", error);
  }
}
