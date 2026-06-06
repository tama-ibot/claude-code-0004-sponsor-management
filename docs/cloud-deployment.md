# Cloud Deployment Plan

## Target Architecture

- App hosting: Vercel
- Database: Supabase Postgres
- Auth: Supabase Auth
- Authorization: application roles stored in `profiles`
- Evidence: URL-only management for now

## Data Policy

Customer names, sales amounts, proposals, contracts, and inspection notes can be stored in Supabase because the app is intended to work like a SaaS system.

Secrets and generated local data must not be committed:

- `.env`
- `data/`
- `.next/`
- `node_modules/`

## Roles

Use these roles first:

- `sales`: sales staff
- `manager`: sales manager
- `ops`: operations staff
- `admin`: system administrator

Initial behavior:

- `sales`: create and update assigned slots, proposals, companies
- `manager`: view and update all commercial data
- `ops`: update production and inspection fields
- `admin`: manage users and all data

## Migration Steps

1. Create a Supabase project.
2. Run `docs/supabase-schema.sql` in Supabase SQL Editor.
3. Create users in Supabase Auth.
4. Add each user to `profiles` with a role.
5. Set Vercel environment variables from `.env.example`.
6. Switch `APP_DATA_PROVIDER` from `sqlite` to `supabase` after the app adapter is implemented.

## Cost Notes

The prototype can be tested on free tiers, but business use with team members and customer data should plan for paid capacity later.

Recommended starting point:

- Vercel Pro for team/business app hosting
- Supabase paid plan when data volume, backups, or operational needs exceed the free tier
