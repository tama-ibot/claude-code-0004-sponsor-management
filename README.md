# Sponsorship Management Prototype

Sports team sponsorship product, sales slot, company, contract, and inspection management prototype.

## Current Stack

- Next.js
- React
- Local SQLite via `better-sqlite3`
- Optional Supabase data provider via `APP_DATA_PROVIDER=supabase`

## Cloud Target

The planned production-style setup is:

- Vercel for app hosting
- Supabase Postgres for shared data
- Supabase Auth for user accounts
- Application roles for sales, manager, operations, and admin users

See:

- `docs/cloud-deployment.md`
- `docs/supabase-schema.sql`
- `.env.example`

## Getting Started

Install dependencies and run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local Data

Local SQLite data is generated under:

```text
data/sponsorship.db
```

This directory is ignored by Git.

## Commands

```bash
npm run dev
npm run build
npm run lint
```

## Deployment Direction

Before deploying for team use, implement the Supabase data adapter and auth flow. The schema draft is in `docs/supabase-schema.sql`.
The Supabase data adapter is present, but auth screens and role enforcement are still next work.
