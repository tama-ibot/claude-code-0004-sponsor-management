# Prototype Notes

## Data Storage

This prototype currently uses local SQLite via `better-sqlite3`.

Database files are created under:

```text
data/sponsorship.db
```

The app initializes the schema and seed data automatically on first load.

The next target is Supabase Postgres for team use on Vercel. See `docs/cloud-deployment.md` and `docs/supabase-schema.sql`.
`APP_DATA_PROVIDER=supabase` switches the server data layer to Supabase after the required environment variables are set.

## Current Scope

- Product master list
- Inventory slot list
- Inventory slot detail editing
- Company master list
- Proposal history per inventory slot
- Contract list and lightweight contract creation
- Lightweight inspection URL management per inventory slot
- Match-day calendar view grouped from slot dates
- Product master detail with related inventory slots
- CSV/TSV import into local SQLite, including classification-only pasted sheets
- Import preview with parsed product and inventory slot counts
- Product master notation variance check
- Company notation variance check across company master, slots, and proposals
- Consolidation candidate review screen for products and companies
- In-page review status and memo controls for consolidation candidates
- Persisted review status and notes in local SQLite
- Review progress summary and status filtering
- Product summary
- Sales and gross margin summary
- Data provider switch for SQLite and Supabase
- Supabase Auth login gate and role checks for cloud mode
- Admin user management screen for Supabase Auth users
- SQLite to Supabase seed SQL export script

## Commands

```bash
npm run dev
npm run build
npm run lint
```
