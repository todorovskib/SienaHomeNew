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

## Admin Login Setup

1. In Supabase Dashboard, create a user in **Authentication > Users**.
2. In **Table Editor > profiles**, set that user `role` to `admin`.
3. Open the app and go to:
   - `http://localhost:5173/mk/admin/login` or
   - `http://localhost:5173/en/admin/login`
4. Sign in with that admin account.

After login, admin users can create, update, and delete products directly from the admin dashboard.

## Build for Production

```bash
npm run build
```

The production output is in `dist`.

## Deploy

You can deploy `dist` on Netlify, Vercel, Cloudflare Pages, or your own server.

Important: this is a single-page app, so configure route fallback to `index.html`.
- Netlify fallback is already included in `public/_redirects`.

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
