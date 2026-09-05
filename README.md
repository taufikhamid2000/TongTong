# TongTong

A neighborhood shuttle booking app connecting riders, route operators, and residential neighborhoods.

**Live demo:** https://tongtong-tawny.vercel.app

## Overview
TongTong lets small-scale shuttle operators run scheduled routes for specific neighborhoods, and lets residents book seats on those routes. Operators create and manage routes, riders browse routes available to their neighborhood and book trips, and a scheduled job locks trips once they're no longer bookable. It's built for informal/community transport setups rather than city-wide transit.

## Tech Stack
- **Framework:** Next.js 16 (App Router), React 19
- **Language:** TypeScript, Zod 4 for validation
- **Styling:** Tailwind CSS 4
- **Backend/DB:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Scheduled jobs:** Vercel Cron (`server-only` package for server-side-only code)

## Features
- Auth: login and signup flows (`app/(auth)`)
- Account management (`app/account`)
- Neighborhood browsing (`app/neighborhood/[neighborhoodId]`)
- Operator tools: create and manage routes (`app/operator/routes`, `app/operator/routes/new`, `app/operator/routes/[routeId]`)
- Rider tools: browse neighborhoods and manage bookings (`app/rider/neighborhood`, `app/rider/bookings`)
- Automated trip locking via a cron-triggered API route (`app/api/cron/lock-trips`), secured with a shared bearer secret

## Getting Started
```bash
npm install
cp .env.example .env.local
npm run dev
```

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key bypassing RLS, used for admin-side operations (e.g. verifying an operator's license) |
| `CRON_SECRET` | Yes | Shared secret Vercel Cron sends as `Authorization: Bearer <value>` when calling `/api/cron/lock-trips` |

## Scripts
| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Deployment
Deployed on Vercel at the live demo URL above. Requires the same Supabase env vars set in the Vercel project's environment variables, plus `CRON_SECRET` for the Vercel Cron job that hits `/api/cron/lock-trips` on a schedule (configured in `vercel.json`).

---
Built by [Muhammad Taufik](https://taufik.vercel.app)
