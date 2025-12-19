import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { error } from "console";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser?.id) {
      return NextResponse.json(
        {
          error: "User not authenticated",
        },
        { status: 401 }
      );
    }

    // Pull subscription tier (and optionally active flag) for this user
    const profile = await prisma.profile.findUnique({
      where: { userId: clerkUser.id },
      select: {
        subscriptionTier: true,
        subscriptionActive: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Match the shape the client expects: subscription.subscriptionTier
    return NextResponse.json(
      {
        subscription: {
          subscriptionTier: profile.subscriptionTier,
          subscriptionActive: profile.subscriptionActive,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
