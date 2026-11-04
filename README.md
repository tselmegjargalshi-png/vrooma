# Vrooma

Vrooma is an automotive marketplace platform for Mongolia: buy, sell, compare, finance and inspect vehicles, with a built in CRM for sellers and dealerships and an admin console. The interface is Mongolian by default with English available (Ө and Ү render correctly), prices are in ₮ with an optional USD reference.

> **Everything in this build is a demo.** Listings, people, dealerships, prices, photos (generated illustrations), inspection reports and payments are sample data. Payments are simulated and move no money. Inspection reports are written by inspectors inside the platform, and the platform does not claim access to any government database. A banner, DEMO badges and the footer say so.

## What works

Public: home, advanced search (brand, model, category, price, manufacture year, import year, mileage, engine, fuel, transmission, drive, LHD or RHD, colour, doors, seats, province, seller type, accident history, origin, eco), grid and list view, sorting, saved searches, vehicle page (gallery, full screen viewer, demo video tab, specs, seller verification, inquiry, inspection booking, share, favorite, similar cars), compare up to 4 with differences highlighted, financing calculator (12 to 60 months, scenarios, estimates only), interactive map (schematic demo map, no API key needed), dealerships, news.

Accounts and roles: customer, seller, dealer owner, agent, inspector, admin, super admin, enforced in the UI by `src/lib/perms.ts` and `Guard`.

Business tools: listing form with photo upload and compression, CRM with 8 lead statuses, notes, reminders, assignment to agents, inspection scheduling, inspector report editor with printable report, messaging, notifications (price drops, saved search matches, inquiries, expiry), promotion packages and simulated QPay, SocialPay, bank and cash payments, analytics, admin tools (listing approval, users, dealerships, brands and models, ads, payments, flags, audit log).

## Run locally

```
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

Demo mode needs no backend. Data lives in the browser (IndexedDB) and survives reloads. The "Reset demo data" button restores the seed.

### Demo accounts (password `demo1234` for all)

| Role | Email |
| --- | --- |
| Super admin | superadmin@vrooma.demo |
| Admin | admin@vrooma.demo |
| Dealer owner | dealer1@vrooma.demo to dealer5@vrooma.demo |
| Agent | agent11@vrooma.demo and others |
| Seller | seller01@vrooma.demo to seller15@vrooma.demo |
| Inspector | inspector1@vrooma.demo, inspector2@vrooma.demo |
| Customer | customer01@vrooma.demo to customer30@vrooma.demo |

New accounts can be registered as customer or seller.

## Environment variables

See `.env.example`.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_DATA_MODE` | `demo` (default) runs on the browser store |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only, never exposed to the browser |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | Photo bucket, `vehicle-media` |
| `NEXT_PUBLIC_SITE_URL` | Public URL |
| `NEXT_PUBLIC_USD_RATE` | ₮ per 1 USD for the optional USD display |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Optional, for a live map later |
| `QPAY_*`, `SOCIALPAY_*` | Optional, real gateways are not connected in this build |

## Supabase (production path)

`supabase/schema.sql` contains the full schema: profiles with 7 roles, dealers, vehicles, leads, appointments, reports, messaging, notifications, favorites, saved searches, packages, payments, ads, campaigns, flags, audit log, row level security policies by role, and the `vehicle-media` storage bucket.

1. Create a Supabase project and run `supabase/schema.sql` in the SQL editor.
2. Put the URL and keys in `.env.local` and in Vercel.
3. Honest status: the UI currently reads and writes through the demo store in `src/lib/store.ts`. The schema, policies and env wiring are ready, but replacing the store actions with Supabase queries is the remaining integration step. Real payment gateways and server side email or SMS are also not connected.

## Deploy to Vercel

1. Import the GitHub repository in Vercel (Framework: Next.js, no extra settings).
2. Add the environment variables above (demo mode only needs `NEXT_PUBLIC_DATA_MODE=demo` and `NEXT_PUBLIC_SITE_URL`).
3. Deploy. Every push to `main` redeploys.

## Quality checks

```
npm run typecheck
node scripts/check-i18n.mjs     # dictionaries complete in both languages, no hyphens or dashes
npm run build && npx next start -p 3100 &
npm run e2e                     # Playwright, 34 steps incl. the full marketplace workflow
```

The end to end script covers: seller registration, listing creation with image upload, admin approval, public visibility, customer search, 31 filter cases, sorting, compare, favorites, inquiry, messaging, CRM and inspection scheduling, inspector report, financing calculator against the formula, simulated payments, marking sold, analytics, role permissions, brand management, map, gallery, a no hyphen or dash scan of every screen in both languages and all roles, font coverage and a 390px mobile layout check.

## Stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, zustand with IndexedDB persistence, Supabase (schema ready), Vercel.
