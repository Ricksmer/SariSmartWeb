# SariSmart

Inventory management for sari-sari stores, shared across multiple users via inventory codes. Next.js (App Router) + Supabase + Vercel.

## What's in this scaffold

- **Auth** — Supabase email/password (`/login`), confirm-password on register
- **Inventories** — `/`: create a new inventory or join an existing one by code. Each inventory can be shared with multiple people (invite code, shareable link, or email invite) — see each inventory's **Settings** tab
- **Products & categories** — per inventory: CRUD, search, filter, low-stock and missing-price badges, a **Size / unit** field (e.g. "500ml", "12g"), a **Remarks** field, and product names are auto-formatted to Title Case on save
- **Archive** — products can be archived (hidden from the active list and the price list) instead of deleted, with a separate Archived tab to restore or permanently delete them
- **Print/export** — pick all products, whole categories, or individual items, download a PDF (bold, "Brand - Name … Price   Remarks" layout, grouped by category)
- **Public price list** — `/price-list/[inventoryId]`: no login required, fetches once and filters client-side, shows only name/brand/price
- **Overview** — per-inventory dashboard: product count, missing-price count, low-stock count, capital tied up

## 1. Supabase setup

1. [supabase.com](https://supabase.com) → New project
2. SQL Editor → run `supabase/migrations/0001_init.sql`, then `supabase/migrations/0002_inventories.sql` **in that order**
   - `0002` is **non-destructive**: if you already have products/categories from `0001`, it automatically creates a personal inventory for each existing user and migrates their data into it. Nothing is dropped.
   - If you previously ran an earlier version of `0002` and ran into an RLS recursion error, run `supabase/migrations/0003_fix_rls_recursion.sql` in the SQL Editor to apply the fix.
3. Authentication → Providers → Email → make sure "Allow new users to sign up" is on
4. Project Settings → API (or the "Legacy anon, service_role API keys" tab if you're on the new key system) → copy the **Project URL**, **anon/public** key, and **service_role** key

## 2. Environment variables

```bash
cp .env.local.example .env.local
```
Fill in the three values from step 1.

**On Vercel specifically:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set as **Config** type (not Secret) — the app's `proxy.ts` runs on the Edge Runtime, which can't read Secret-type env vars. `SUPABASE_SERVICE_ROLE_KEY` should stay Secret.

## 3. Run locally

```bash
npm install
npm run dev
```

## 4. Deploy to Vercel

Push to GitHub, import at [vercel.com/new](https://vercel.com/new), add the three env vars (see note above), deploy.

## How the inventory-sharing model works

- A user creates an inventory (gets an owner role + unique invite code) or joins one with a code someone shared
- Anyone with the code has full access to add/edit/remove products — there's no separate "viewer" role yet, everyone who joins can edit
- A user can belong to multiple inventories, switch between them from `/`
- Each inventory's **Settings** tab has the invite code, a copyable join link (`/join/[code]`), an email invite (opens the user's mail client with a prefilled message — no email service is wired up, it's just a `mailto:` link), the member list, rename (owner only), and leave (non-owners)

## Notes / next steps

- **Roles beyond owner/member**: the schema has a `role` column on `inventory_members` ready for this — e.g. a read-only "assistant" role — but everything currently treats owner and member the same except renaming/deleting the inventory itself
- **Capital** is computed on the fly (`buy_price × quantity`), not stored
- **App icons** (`public/icon-192.png`, `icon-512.png`) are simple placeholders
