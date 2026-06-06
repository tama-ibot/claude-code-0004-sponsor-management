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
3. Insert one row into `organizations`.
4. Copy that organization `id` into `SUPABASE_ORGANIZATION_ID`.
5. Create users in Supabase Auth.
6. Add each user to `profiles` with a role.
7. Set Vercel environment variables from `.env.example`.
8. Switch `APP_DATA_PROVIDER` from `sqlite` to `supabase`.
9. Check `/api/health` on the deployed app.

## Migrating Local Prototype Data

Generate a local seed SQL file from SQLite:

```bash
npm run export:supabase-seed
```

The file is written to:

```text
data/supabase-seed.sql
```

`data/` is ignored by Git. Replace `__ORGANIZATION_ID__` with the `organizations.id` value before running the seed SQL in Supabase.

Example organization setup:

```sql
insert into organizations (name)
values ('Your Team Name')
returning id;
```

Example profile setup after creating a Supabase Auth user:

```sql
insert into profiles (id, organization_id, display_name, role)
values (
  'AUTH_USER_ID',
  'ORGANIZATION_ID',
  'User Name',
  'manager'
);
```

## Auth Behavior

When `APP_DATA_PROVIDER=supabase`, the app requires Supabase Auth login before loading data.

Mutation permissions:

- `sales`: update slots, create companies, create proposals
- `ops`: update slots
- `manager`: all commercial operations
- `admin`: all operations

Admin users can create additional Supabase Auth users from the in-app user management screen.

When `APP_DATA_PROVIDER=sqlite`, auth checks are bypassed for local prototyping.

## Health Check

Open this URL after local or Vercel setup:

```text
/api/health
```

It returns provider mode, required environment variable status, and Supabase organization connectivity without exposing secret values.

## Cost Notes

The prototype can be tested on free tiers, but business use with team members and customer data should plan for paid capacity later.

Recommended starting point:

- Vercel Pro for team/business app hosting
- Supabase paid plan when data volume, backups, or operational needs exceed the free tier
