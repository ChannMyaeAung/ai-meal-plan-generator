import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/create-profile ensures every authenticated Clerk user has a
// matching Prisma profile row that downstream features rely on.

export async function POST(request: Request) {
  try {
    // Clerk user lookup is required so we can map the profile to a stable id.
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json(
        { error: "User not found in Clerk" },
        { status: 404 }
      );
    }
    const email = clerkUser?.emailAddresses[0]?.emailAddress || "";
    if (!email) {
      return NextResponse.json(
        { error: "User does not have an email address" },
        { status: 400 }
      );
    }

    // Prevent duplicate Prisma rows on repeated calls (e.g., refresh).
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
    });
    if (existingProfile) {
      return NextResponse.json({
        message: "Profile already exists",
      });
    }

    // Seed a baseline profile so subscription/webhook flows can update it later.
    await prisma.profile.create({
      data: {
        userId: clerkUser.id,
        email: email,
        subscriptionTier: null,
        stripeSubscriptionId: null,
        subscriptionActive: false,
      },
    });

    return NextResponse.json(
      { message: "Profile created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
