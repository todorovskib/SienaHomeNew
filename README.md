# Siena Home

Siena Home website source code, ready to run locally and host from your own GitHub repository.

This repository is now a standard Vite + React project. Bolt-specific files were removed.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Supabase (auth/content/products)

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
Copy-Item .env.example .env
```

3. Set your Supabase values in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

4. Start dev server:

```bash
npm run dev
```

5. Open `http://localhost:5173`.

## Database Setup (Supabase)

This repo includes SQL migrations in `supabase/migrations`.
Run them in filename order in the Supabase SQL Editor, or use Supabase CLI with your project.

Important migration for admin CRUD security:

- `supabase/migrations/20260305170000_admin_product_management_hardening.sql`
- `supabase/migrations/20260608123000_commerce_analytics_checkout.sql`
- `supabase/migrations/20260608124500_advanced_analytics.sql`

## Admin Login Setup

1. In Supabase Dashboard, create a user in **Authentication > Users**.
2. In **Table Editor > profiles**, set that user `role` to `admin`.
3. Open the app and go to:
   - `http://localhost:5173/mk/admin/login` or
   - `http://localhost:5173/en/admin/login`
4. Sign in with that admin account.

After login, admin users can create, update, and delete products directly from the admin dashboard.

## Commerce, Analytics, and Checkout

The commerce migration restores product prices, creates first-party analytics tables, and creates checkout order tables.

Run these migrations in Supabase SQL Editor:

```text
supabase/migrations/20260608123000_commerce_analytics_checkout.sql
supabase/migrations/20260608124500_advanced_analytics.sql
```

Analytics starts only after the visitor accepts the cookie banner. Admin users can see the advanced analytics dashboard inside the admin page.

Tracked analytics include:

- Page views, time on page, scroll depth, buttons, links, and custom clicks.
- Product views, product card clicks, favorite adds/removes, quote clicks, add-to-cart events, checkout starts, checkout failures, checkout success returns, and checkout cancellations.
- Visitor ID, session ID, page path, language, traffic source, UTM campaign fields, referrer domain, browser, OS, device type, viewport, screen size, and event metadata.
- Admin dashboard metrics for visitors, sessions, product funnel, cart rate, checkout rate, conversion rate, top products, top pages, top searches, traffic sources, devices, browsers, daily activity, and recent events.

How to use analytics:

1. Open the site in a browser and accept the analytics cookie banner.
2. Visit product pages, search/filter products, click product cards, add products to cart, and start checkout.
3. Log in as an admin and open `http://localhost:5173/mk/admin`.
4. Use the 7/30/90 day range buttons to change the reporting period.
5. Click `Export CSV` to download the raw event data for spreadsheets or deeper analysis.

Campaign tracking works with UTM links. Example:

```text
https://your-domain.com/mk/products?utm_source=facebook&utm_medium=paid&utm_campaign=june_sale
```

Supabase also includes reporting views you can query in SQL Editor:

```sql
select * from public.analytics_daily_summary;
select * from public.analytics_top_pages;
select * from public.analytics_product_funnel;
select * from public.analytics_revenue_summary;
```

Checkout uses a Supabase Edge Function so payment provider secrets are never exposed in the browser:

```text
supabase/functions/create-checkout-session/index.ts
supabase/functions/stripe-webhook/index.ts
```

To connect real payments, deploy both functions and set these Supabase Edge Function secrets:

```env
STRIPE_SECRET_KEY=sk_live_or_test_key
STRIPE_WEBHOOK_SECRET=whsec_from_stripe_webhook
SITE_URL=https://your-domain.com
CHECKOUT_CURRENCY=mkd
```

In Stripe Dashboard, create a webhook endpoint pointing to:

```text
https://your-project.supabase.co/functions/v1/stripe-webhook
```

Subscribe the webhook to:

- `checkout.session.completed`
- `checkout.session.expired`

The webhook marks orders as `paid` or `cancelled` and records `purchase_completed` or `checkout_expired` analytics events.

For local display currency, set:

```env
VITE_STORE_CURRENCY=MKD
```

## Build for Production

```bash
npm run build
```

The production output is in `dist`.

## Deploy

You can deploy `dist` on Netlify, Vercel, Cloudflare Pages, or your own server.

Important: this is a single-page app, so configure route fallback to `index.html`.
- Netlify fallback is already included in `public/_redirects`.
- Vercel fallback, cache headers, and basic security headers are configured in `vercel.json`.

## Vercel Setup

The deployed admin paths are:

```text
https://sienahome.vercel.app/mk/admin
https://sienahome.vercel.app/mk/admin/login
https://sienahome.vercel.app/mk/admin/dashboard
```

In Vercel, set these environment variables for Production, Preview, and Development:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STORE_CURRENCY=MKD
```

Build settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

If an admin route goes back to the home page, redeploy after confirming `vercel.json` exists in GitHub. Vercel must serve all deep React routes through `index.html`.

## GitHub Workflow

```bash
git add .
git commit -m "Set up self-hosted Siena Home project"
git push
```

## Scripts

- `npm run dev` - start development server
- `npm run build` - build production bundle
- `npm run preview` - preview production build locally
- `npm run lint` - run lint checks
