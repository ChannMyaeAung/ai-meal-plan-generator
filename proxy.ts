import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-up(.*)",
  "subscribe(.*)",
  "/api/webhook(.*)",
  "/api/check-subscription(.*)",
]);

const isSignUpRoute = createRouteMatcher(["/sign-up(.*)"]);

const isMealPlanRoute = createRouteMatcher(["/mealplan(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const userAuth = await auth();
  const { userId } = userAuth; // get user ID after authentication

  // extract pathname and origin from the request URL
  // e.g. /mealplan, /sign-up,etc. for pathname and http://localhost:3000 for origin
  const { pathname, origin } = req.nextUrl;

  if (pathname === "/api/check-subscription") {
    return NextResponse.next();
  }

  // If the route is not public and there's no user, redirect to sign-up
  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/sign-up", origin));
  }

  // If the user is authenticated and is trying to access sign-up, redirect to mealplan
  if (isSignUpRoute(req) && userId) {
    return NextResponse.redirect(new URL("/mealplan", origin));
  }

  // If the user is authenticated and is trying to access mealplan, check subscription status
  if (isMealPlanRoute(req) && userId) {
    try {
      const response = await fetch(
        `${origin}/api/check-subscription?userId=${userId}`
      );
      const data = await response.json();
      // if user is not subscribed, redirect to subscribe page
      if (!data.subscriptionActive) {
        return NextResponse.redirect(new URL("/subscribe", origin));
      }
    } catch (error) {
      console.error("Error in mealplan route middleware:", error);
      return NextResponse.redirect(new URL("/sign-up", origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
