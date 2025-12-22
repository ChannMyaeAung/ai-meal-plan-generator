# AI Meal Plan Generator

AI powered meal-planning experience built with the Next.js App Router, Clerk authentication, Stripe subscriptions, Prisma/Postgres (Neon) and shadcn/ui. Users can subscribe to unlock AI-generated weekly meal plans, manage their plan tier from the profile page, and cancel or switch plans at any time.

## Tech Stack

- **Framework**: Next.js 16 (App Router + Turbopack)
- **Styling/UI**: Tailwind CSS, shadcn/ui, motion/react animations
- **Auth**: Clerk
- **Payments**: Stripe Checkout + Webhooks (+ client-side finalize fallback)
- **Database**: Prisma ORM with Neon Postgres
- **AI**: OpenRouter (configurable via `OPEN_ROUTER_API_KEY`)

## Project Highlights

- Animated hero, testimonials, and marketing sections built for both desktop and mobile.
- Subscription-aware navigation—hides the subscribe CTA for active users.
- Profile dashboard with plan details, plan switching, unsubscribe flow, and inline feedback via React Query + toast notifications.
- Server routes for generating meal plans, checking subscription state, creating profiles, changing plans, unsubscribing, Stripe checkout, webhook ingestion, and a `finalize-checkout` fallback route that upserts the Neon profile if the webhook is delayed.
- Deterministic animation values to avoid hydration mismatches.

## Getting Started

### 1. Clone & install

```bash
pnpm install
```

### 2. Environment variables

Create `.env.local` using the values from your Stripe, Clerk, Neon, and OpenRouter dashboards:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_WEEKLY=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_ANNUAL=

NEXT_PUBLIC_BASE_URL=http://localhost:3000

DATABASE_URL=postgresql://... (Neon connection string)
OPEN_ROUTER_API_KEY=
```

> ℹ️ Keep these keys in **test mode** while developing. Production gets its own set of live credentials.

### 3. Database setup

This project expects a Prisma schema that already lives in `prisma/schema.prisma`.

```bash
pnpm prisma migrate deploy   # or dev, depending on your workflow
pnpm prisma generate
```

### 4. Stripe webhook (local)

Stripe events need to reach `http://localhost:3000/api/webhook` while developing:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

Make sure the webhook secret reported by the CLI matches `STRIPE_WEBHOOK_SECRET`.

### 5. Run locally

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) and run through the flow:

1. Sign up via Clerk → `/create-profile` seeds the Neon row.
2. Choose a plan on `/subscribe` → Stripe Checkout.
3. On redirect, the landing page calls `/api/profile/finalize-checkout` (also handled by webhooks) to mark the subscription active.
4. Use `/profile` to change tiers or cancel.

## Production Deployment (Vercel)

1. Push to GitHub/GitLab and connect the repo to Vercel.
2. In Vercel Project Settings → Environment Variables, add the same keys as `.env.local`, but scoped per environment (Preview vs Production). Use production values for Production.
3. In the Stripe Dashboard (Test mode first, then Live when ready) add a webhook endpoint pointing to `https://<your-vercel-domain>/api/webhook` and paste the generated signing secret into Vercel.
4. Add your Vercel domain to Clerk’s allowed origins + redirect URLs.
5. Deploy. Run through a checkout in the deployed environment and confirm Neon updates. The client-side finalize step provides immediate feedback while webhooks propagate.

## Testing Checklist

- `pnpm run lint` – linting
- `pnpm run build` – ensures Suspense requirements and bundling pass
- Manual flows:
  - Sign up → profile auto-creation
  - Checkout → webhook + finalize endpoint update the database
  - `/profile` plan switch/cancel
  - `/mealplan` access is blocked until subscribed

## Troubleshooting

- **Webhook not firing locally**: ensure `stripe listen` is running and the CLI reported secret matches `.env.local`.
- **Subscription not updating**: check server logs—`finalize-checkout` upserts profiles immediately, but if it fails you’ll see the error in Vercel/terminal logs.
- **Build fails with `useSearchParams` warning**: ensure any hook that reads URL search params is rendered inside a `<Suspense>` boundary (see `FinalizeCheckoutBanners` in `app/page.tsx`).

## Useful Docs

- [Next.js App Router](https://nextjs.org/docs/app)
- [Clerk + Next.js](https://clerk.com/docs/nextjs)
- [Stripe Checkout + Webhooks](https://stripe.com/docs/payments/checkout)
- [Prisma with Next.js](https://www.prisma.io/docs/guides/nextjs)

Enjoy shipping! 🚀
