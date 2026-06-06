import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dbPath = path.resolve(process.cwd(), process.env.SQLITE_DB_PATH || "data/sponsorship.db");
const outputPath = path.resolve(process.cwd(), process.env.SUPABASE_SEED_OUTPUT || "data/supabase-seed.sql");
const organizationId = process.env.SUPABASE_ORGANIZATION_ID || "__ORGANIZATION_ID__";

if (!fs.existsSync(dbPath)) {
  console.error(`SQLite database was not found: ${dbPath}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const db = new Database(dbPath, { readonly: true, fileMustExist: true });

function quote(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "0";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function insert(table, values) {
  const columns = Object.keys(values);
  return `insert into ${table} (${columns.join(", ")}) values (${columns.map((column) => quote(values[column])).join(", ")}) on conflict do nothing;`;
}

const products = db.prepare("select * from products order by created_at").all();
const slots = db.prepare("select * from inventory_slots order by created_at").all();
const companies = db.prepare("select * from companies order by created_at").all();
const proposals = db.prepare("select * from proposals order by created_at").all();
const contracts = db.prepare("select * from contracts order by created_at").all();
const contractItems = db.prepare("select * from contract_items order by created_at").all();
const reviewStates = db.prepare("select * from review_states order by created_at").all();

const lines = [
  "-- Supabase seed generated from local SQLite.",
  "-- Replace __ORGANIZATION_ID__ with the id from the organizations table before running this file.",
  "begin;",
  "",
  ...products.map((row) =>
    insert("products", {
      id: row.id,
      organization_id: organizationId,
      display_name: row.display_name,
      category_large: row.category_large,
      category_middle: row.category_middle,
      category_small: row.category_small,
      category_detail: row.category_detail,
      inventory_type: row.inventory_type,
      standard_price: row.standard_price,
      standard_cost: row.standard_cost,
      standard_spec: row.standard_spec,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  ),
  "",
  ...companies.map((row) =>
    insert("companies", {
      id: row.id,
      organization_id: organizationId,
      name: row.name,
      industry: row.industry,
      owner: row.owner,
      status: row.status,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  ),
  "",
  ...slots.map((row) =>
    insert("inventory_slots", {
      id: row.id,
      organization_id: organizationId,
      product_id: row.product_id,
      slot_name: row.slot_name,
      slot_number: row.slot_number,
      season: row.season,
      target_match: row.target_match,
      location: row.location,
      status: row.status,
      company: row.company,
      owner: row.owner,
      list_price: row.list_price,
      sales_price: row.sales_price,
      cost: row.cost,
      production_due: row.production_due,
      production_status: row.production_status,
      spec_detail: row.spec_detail,
      inspection_status: row.inspection_status,
      evidence_urls: row.evidence_urls,
      inspection_note: row.inspection_note,
      inspected_at: row.inspected_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  ),
  "",
  ...proposals.map((row) =>
    insert("proposals", {
      id: row.id,
      organization_id: organizationId,
      slot_id: row.slot_id,
      company_name: row.company_name,
      proposed_date: row.proposed_date,
      status: row.status,
      proposed_price: row.proposed_price,
      owner: row.owner,
      lost_reason: row.lost_reason,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  ),
  "",
  ...contracts.map((row) =>
    insert("contracts", {
      id: row.id,
      organization_id: organizationId,
      company_name: row.company_name,
      name: row.name,
      season: row.season,
      start_date: row.start_date,
      end_date: row.end_date,
      total_amount: row.total_amount,
      status: row.status,
      billing_status: row.billing_status,
      owner: row.owner,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  ),
  "",
  ...contractItems.map((row) =>
    insert("contract_items", {
      id: row.id,
      organization_id: organizationId,
      contract_id: row.contract_id,
      slot_id: row.slot_id,
      item_name: row.item_name,
      allocated_amount: row.allocated_amount,
      cost: row.cost,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  ),
  "",
  ...reviewStates.map((row) =>
    insert("review_states", {
      id: row.id,
      organization_id: organizationId,
      review_key: row.review_key,
      review_type: row.review_type,
      status: row.status,
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
  ),
  "",
  "commit;",
  "",
];

fs.writeFileSync(outputPath, lines.join("\n"), "utf8");

console.log(`Wrote ${outputPath}`);
console.log(
  JSON.stringify(
    {
      products: products.length,
      slots: slots.length,
      companies: companies.length,
      proposals: proposals.length,
      contracts: contracts.length,
      contractItems: contractItems.length,
      reviewStates: reviewStates.length,
    },
    null,
    2,
  ),
);
