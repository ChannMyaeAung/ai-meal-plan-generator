import { getPriceIDFromType } from "@/lib/plans";
import { stripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

// POST /api/checkout exchanges a selected plan for a Stripe Checkout session
// so that client-side code can safely redirect the user to Stripe-hosted UI.

export async function POST(req: NextRequest) {
  try {
    // Stripe session metadata relies on these three values.
    const { planType, userId, email } = await req.json();
    if (!planType || !userId || !email) {
      return NextResponse.json(
        { error: "Plan type, user id, and email are required." },
        { status: 400 }
      );
    }

    // Only allow plan types we actually price to avoid tampering.
    const allowedPlans = ["week", "month", "year"];

    if (!allowedPlans.includes(planType)) {
      return NextResponse.json(
        { error: "Invalid plan type." },
        { status: 400 }
      );
    }

    const priceID = getPriceIDFromType(planType);

    if (!priceID) {
      return NextResponse.json(
        { error: "Price ID not found for the given plan type." },
        { status: 400 }
      );
    }

    // Determine where Stripe should send the buyer after checkout.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    if (!baseUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_BASE_URL is not configured." },
        { status: 500 }
      );
    }

    // Create the subscription checkout session with the mapped price id.
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceID,
          quantity: 1,
        },
      ],
      customer_email: email,
      mode: "subscription",
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscribe`,
      metadata: {
        clerkUserId: userId,
        planType,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while creating the checkout session." },
      { status: 500 }
    );
  }
}
