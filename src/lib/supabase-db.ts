import { createClient } from "@supabase/supabase-js";
import type {
  DbCompany,
  DbContract,
  DbContractItem,
  DbProduct,
  DbReviewState,
  DbShape,
  DbSlot,
} from "./db";

type SupabaseRecord = Record<string, string | number | boolean | null>;

type SupabaseTable = {
  Row: SupabaseRecord;
  Insert: SupabaseRecord;
  Update: Partial<SupabaseRecord>;
  Relationships: [];
};

type SupabaseDatabase = {
  public: {
    Tables: {
      organizations: SupabaseTable;
      profiles: SupabaseTable;
      products: SupabaseTable;
      companies: SupabaseTable;
      inventory_slots: SupabaseTable;
      proposals: SupabaseTable;
      contracts: SupabaseTable;
      contract_items: SupabaseTable;
      review_states: SupabaseTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type SupabaseProduct = {
  id: string;
  display_name: string;
  category_large: string;
  category_middle: string;
  category_small: string;
  category_detail: string;
  inventory_type: string;
  standard_price: number;
  standard_cost: number;
  standard_spec: string;
};

type SupabaseSlot = {
  id: string;
  product_id: string;
  slot_name: string;
  slot_number: string;
  season: string;
  target_match: string;
  location: string;
  status: string;
  company: string;
  owner: string;
  list_price: number;
  sales_price: number;
  cost: number;
  production_due: string;
  production_status: string;
  spec_detail: string;
  inspection_status: string;
  evidence_urls: string;
  inspection_note: string;
  inspected_at: string;
};

export type SupabaseUserAccount = {
  id: string;
  email: string;
  displayName: string;
  role: "sales" | "manager" | "ops" | "admin";
  organizationId: string;
};

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase is selected but NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
  }

  return createClient<SupabaseDatabase>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function checkSupabaseConnection() {
  const client = getSupabase();
  const organizationId = getOrganizationId();
  const { data, error } = await client.from("organizations").select("id, name").eq("id", organizationId).maybeSingle();
  if (error) {
    return {
      ok: false,
      message: error.message,
      organizationFound: false,
    };
  }
  return {
    ok: Boolean(data),
    message: data ? "Supabase connection ok." : "Organization was not found.",
    organizationFound: Boolean(data),
  };
}

function getOrganizationId() {
  const organizationId = process.env.SUPABASE_ORGANIZATION_ID;
  if (!organizationId) {
    throw new Error("Supabase is selected but SUPABASE_ORGANIZATION_ID is missing.");
  }
  return organizationId;
}

function withOrganizationId<T extends Record<string, unknown>>(payload: T) {
  return { ...payload, organization_id: getOrganizationId() };
}

function productFromRow(row: SupabaseProduct): DbProduct {
  return {
    id: row.id,
    displayName: row.display_name,
    categoryLarge: row.category_large,
    categoryMiddle: row.category_middle,
    categorySmall: row.category_small,
    categoryDetail: row.category_detail,
    inventoryType: row.inventory_type,
    standardPrice: row.standard_price,
    standardCost: row.standard_cost,
    standardSpec: row.standard_spec,
  };
}

function slotFromRow(row: SupabaseSlot): DbSlot {
  return {
    id: row.id,
    productId: row.product_id,
    slotName: row.slot_name,
    slotNumber: row.slot_number,
    season: row.season,
    targetMatch: row.target_match,
    location: row.location,
    status: row.status,
    company: row.company,
    owner: row.owner,
    listPrice: row.list_price,
    salesPrice: row.sales_price,
    cost: row.cost,
    productionDue: row.production_due,
    productionStatus: row.production_status,
    specDetail: row.spec_detail,
    inspectionStatus: row.inspection_status,
    evidenceUrls: row.evidence_urls,
    inspectionNote: row.inspection_note,
    inspectedAt: row.inspected_at,
  };
}

function assertSingle<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Supabase returned no data.");
  return data;
}

async function assertSlotBelongsToOrganization(client: ReturnType<typeof createClient<SupabaseDatabase>>, slotId: string) {
  const { data, error } = await client
    .from("inventory_slots")
    .select("id")
    .eq("organization_id", getOrganizationId())
    .eq("id", slotId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("指定された販売枠が見つからないか、この組織に属していません。");
}

async function assertProductBelongsToOrganization(client: ReturnType<typeof createClient<SupabaseDatabase>>, productId: string) {
  const { data, error } = await client
    .from("products")
    .select("id")
    .eq("organization_id", getOrganizationId())
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("指定された商品が見つからないか、この組織に属していません。");
}

export async function getSupabaseAppData(): Promise<DbShape> {
  const client = getSupabase();
  const organizationId = getOrganizationId();

  const productQuery = client
    .from("products")
    .select("*")
    .eq("organization_id", organizationId)
    .order("category_large")
    .order("category_middle")
    .order("category_small")
    .order("category_detail");
  const slotQuery = client.from("inventory_slots").select("*").eq("organization_id", organizationId).order("created_at").order("slot_number");
  const companyQuery = client.from("companies").select("id, name, industry, owner, status, note").eq("organization_id", organizationId).order("name");
  const proposalQuery = client
    .from("proposals")
    .select("id, slot_id, company_name, proposed_date, status, proposed_price, owner, lost_reason, note")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  const contractQuery = client
    .from("contracts")
    .select("id, company_name, name, season, start_date, end_date, total_amount, status, billing_status, owner, note")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  const contractItemQuery = client
    .from("contract_items")
    .select("id, contract_id, slot_id, item_name, allocated_amount, cost, note")
    .eq("organization_id", organizationId)
    .order("created_at");
  const reviewQuery = client.from("review_states").select("id, review_key, review_type, status, note").eq("organization_id", organizationId).order("created_at");

  const [products, slots, companies, proposals, contracts, contractItems, reviewStates] = await Promise.all([
    productQuery,
    slotQuery,
    companyQuery,
    proposalQuery,
    contractQuery,
    contractItemQuery,
    reviewQuery,
  ]);

  for (const result of [products, slots, companies, proposals, contracts, contractItems, reviewStates]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    products: ((products.data || []) as SupabaseProduct[]).map(productFromRow),
    slots: ((slots.data || []) as SupabaseSlot[]).map(slotFromRow),
    companies: (companies.data || []) as DbCompany[],
    proposals: ((proposals.data || []) as Array<{
      id: string;
      slot_id: string;
      company_name: string;
      proposed_date: string;
      status: string;
      proposed_price: number;
      owner: string;
      lost_reason: string;
      note: string;
    }>).map((proposal) => ({
      id: proposal.id,
      slotId: proposal.slot_id,
      companyName: proposal.company_name,
      proposedDate: proposal.proposed_date,
      status: proposal.status,
      proposedPrice: proposal.proposed_price,
      owner: proposal.owner,
      lostReason: proposal.lost_reason,
      note: proposal.note,
    })),
    contracts: ((contracts.data || []) as Array<{
      id: string;
      company_name: string;
      name: string;
      season: string;
      start_date: string;
      end_date: string;
      total_amount: number;
      status: string;
      billing_status: string;
      owner: string;
      note: string;
    }>).map((contract) => ({
      id: contract.id,
      companyName: contract.company_name,
      name: contract.name,
      season: contract.season,
      startDate: contract.start_date,
      endDate: contract.end_date,
      totalAmount: contract.total_amount,
      status: contract.status,
      billingStatus: contract.billing_status,
      owner: contract.owner,
      note: contract.note,
    })),
    contractItems: ((contractItems.data || []) as Array<{
      id: string;
      contract_id: string;
      slot_id: string;
      item_name: string;
      allocated_amount: number;
      cost: number;
      note: string;
    }>).map((item) => ({
      id: item.id,
      contractId: item.contract_id,
      slotId: item.slot_id,
      itemName: item.item_name,
      allocatedAmount: item.allocated_amount,
      cost: item.cost,
      note: item.note,
    })),
    reviewStates: ((reviewStates.data || []) as Array<{
      id: string;
      review_key: string;
      review_type: string;
      status: string;
      note: string;
    }>).map((state) => ({
      id: state.id,
      reviewKey: state.review_key,
      reviewType: state.review_type,
      status: state.status,
      note: state.note,
    })),
  };
}

export async function getSupabaseUserAccounts(): Promise<SupabaseUserAccount[]> {
  const client = getSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("id, organization_id, display_name, role")
    .eq("organization_id", getOrganizationId())
    .order("display_name");

  if (error) throw new Error(error.message);

  const authUsers = await client.auth.admin.listUsers();
  if (authUsers.error) throw new Error(authUsers.error.message);
  const emailById = new Map(authUsers.data.users.map((user) => [user.id, user.email || ""]));

  return ((data || []) as Array<{ id: string; organization_id: string; display_name: string; role: string }>).map((profile) => ({
    id: profile.id,
    email: emailById.get(profile.id) || "",
    displayName: profile.display_name,
    role: profile.role as SupabaseUserAccount["role"],
    organizationId: profile.organization_id,
  }));
}

export async function createSupabaseUserAccount(input: {
  email: string;
  password: string;
  displayName: string;
  role: "sales" | "manager" | "ops" | "admin";
}) {
  const client = getSupabase();
  const { data: userData, error: userError } = await client.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      display_name: input.displayName,
      role: input.role,
    },
  });

  if (userError) throw new Error(userError.message);
  if (!userData.user) throw new Error("Supabase user creation returned no user.");

  const { data, error } = await client
    .from("profiles")
    .insert({
      id: userData.user.id,
      organization_id: getOrganizationId(),
      display_name: input.displayName,
      role: input.role,
    })
    .select("id, organization_id, display_name, role")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: String(data.id),
    email: input.email,
    displayName: String(data.display_name),
    role: String(data.role) as SupabaseUserAccount["role"],
    organizationId: String(data.organization_id),
  };
}

export async function updateSupabaseSlotRecord(
  slotId: string,
  patch: {
    status?: string;
    company?: string;
    salesPrice?: number;
    productionStatus?: string;
    inspectionStatus?: string;
    evidenceUrls?: string;
    inspectionNote?: string;
    inspectedAt?: string;
  },
) {
  const payload: Record<string, string | number> = {};
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.company !== undefined) payload.company = patch.company;
  if (patch.salesPrice !== undefined) payload.sales_price = patch.salesPrice;
  if (patch.productionStatus !== undefined) payload.production_status = patch.productionStatus;
  if (patch.inspectionStatus !== undefined) payload.inspection_status = patch.inspectionStatus;
  if (patch.evidenceUrls !== undefined) payload.evidence_urls = patch.evidenceUrls;
  if (patch.inspectionNote !== undefined) payload.inspection_note = patch.inspectionNote;
  if (patch.inspectedAt !== undefined) payload.inspected_at = patch.inspectedAt;

  const { data, error } = await getSupabase()
    .from("inventory_slots")
    .update(payload)
    .eq("organization_id", getOrganizationId())
    .eq("id", slotId)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("指定された販売枠が見つからないか、この組織に属していません。");
}

export async function createSupabaseCompanyRecord(input: {
  name: string;
  industry: string;
  owner: string;
  status: string;
  note: string;
}) {
  const client = getSupabase();
  const existingQuery = client
    .from("companies")
    .select("id, name, industry, owner, status, note")
    .eq("organization_id", getOrganizationId())
    .eq("name", input.name)
    .maybeSingle();
  const existing = await existingQuery;
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return existing.data as DbCompany;

  const { data, error } = await client
    .from("companies")
    .insert(withOrganizationId(input))
    .select("id, name, industry, owner, status, note")
    .single();

  return assertSingle(data as DbCompany | null, error);
}

export async function createSupabaseProposalRecord(input: {
  slotId: string;
  companyName: string;
  proposedDate: string;
  status: string;
  proposedPrice: number;
  owner: string;
  lostReason: string;
  note: string;
}) {
  const client = getSupabase();
  await assertSlotBelongsToOrganization(client, input.slotId);

  const { data, error } = await client
    .from("proposals")
    .insert(
      withOrganizationId({
        slot_id: input.slotId,
        company_name: input.companyName,
        proposed_date: input.proposedDate,
        status: input.status,
        proposed_price: input.proposedPrice,
        owner: input.owner,
        lost_reason: input.lostReason,
        note: input.note,
      }),
    )
    .select("id, slot_id, company_name, proposed_date, status, proposed_price, owner, lost_reason, note")
    .single();

  const proposal = assertSingle(data, error);
  return {
    id: proposal.id,
    slotId: proposal.slot_id,
    companyName: proposal.company_name,
    proposedDate: proposal.proposed_date,
    status: proposal.status,
    proposedPrice: proposal.proposed_price,
    owner: proposal.owner,
    lostReason: proposal.lost_reason,
    note: proposal.note,
  };
}

export async function createSupabaseContractRecord(input: {
  companyName: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
  billingStatus: string;
  owner: string;
  note: string;
  items: Array<{
    slotId: string;
    itemName: string;
    allocatedAmount: number;
    cost: number;
    note: string;
  }>;
}) {
  const client = getSupabase();
  for (const item of input.items) {
    await assertSlotBelongsToOrganization(client, item.slotId);
  }

  const { data, error } = await client
    .from("contracts")
    .insert(
      withOrganizationId({
        company_name: input.companyName,
        name: input.name,
        season: input.season,
        start_date: input.startDate,
        end_date: input.endDate,
        total_amount: input.totalAmount,
        status: input.status,
        billing_status: input.billingStatus,
        owner: input.owner,
        note: input.note,
      }),
    )
    .select("id, company_name, name, season, start_date, end_date, total_amount, status, billing_status, owner, note")
    .single();

  const contractRow = assertSingle(data, error);
  let insertedItems: {
    data: SupabaseRecord[] | null;
    error: { message: string } | null;
  } = { data: [], error: null };

  try {
    const itemRows = input.items.map((item) =>
      withOrganizationId({
        contract_id: contractRow.id,
        slot_id: item.slotId,
        item_name: item.itemName,
        allocated_amount: item.allocatedAmount,
        cost: item.cost,
        note: item.note,
      }),
    );

    insertedItems =
      itemRows.length > 0
        ? await client.from("contract_items").insert(itemRows).select("id, contract_id, slot_id, item_name, allocated_amount, cost, note")
        : { data: [], error: null };
    if (insertedItems.error) throw new Error(insertedItems.error.message);

    const slotUpdates = await Promise.all(
      input.items.map((item) =>
        client
          .from("inventory_slots")
          .update({
            status: "契約済み",
            company: input.companyName,
            ...(item.allocatedAmount > 0 ? { sales_price: item.allocatedAmount } : {}),
          })
          .eq("organization_id", getOrganizationId())
          .eq("id", item.slotId)
          .select("id")
          .maybeSingle(),
      ),
    );
    const slotUpdateError = slotUpdates.find((result) => result.error)?.error;
    if (slotUpdateError) throw new Error(slotUpdateError.message);
    if (slotUpdates.some((result) => !result.data)) {
      throw new Error("契約対象の販売枠更新に失敗しました。");
    }
  } catch (error) {
    await client.from("contracts").delete().eq("organization_id", getOrganizationId()).eq("id", String(contractRow.id));
    throw error;
  }

  return {
    contract: {
      id: contractRow.id,
      companyName: contractRow.company_name,
      name: contractRow.name,
      season: contractRow.season,
      startDate: contractRow.start_date,
      endDate: contractRow.end_date,
      totalAmount: contractRow.total_amount,
      status: contractRow.status,
      billingStatus: contractRow.billing_status,
      owner: contractRow.owner,
      note: contractRow.note,
    } as DbContract,
    items: (insertedItems.data || []).map((item) => ({
      id: item.id,
      contractId: item.contract_id,
      slotId: item.slot_id,
      itemName: item.item_name,
      allocatedAmount: item.allocated_amount,
      cost: item.cost,
      note: item.note,
    })) as DbContractItem[],
  };
}

export async function upsertSupabaseReviewStateRecord(input: {
  reviewKey: string;
  reviewType: string;
  status: string;
  note: string;
}) {
  const { data, error } = await getSupabase()
    .from("review_states")
    .upsert(
      withOrganizationId({
        review_key: input.reviewKey,
        review_type: input.reviewType,
        status: input.status,
        note: input.note,
      }),
      { onConflict: "organization_id,review_key" },
    )
    .select("id, review_key, review_type, status, note")
    .single();

  const state = assertSingle(data, error);
  return {
    id: state.id,
    reviewKey: state.review_key,
    reviewType: state.review_type,
    status: state.status,
    note: state.note,
  } as DbReviewState;
}

export async function insertSupabaseImportedData(
  products: Array<{
    displayName: string;
    categoryLarge: string;
    categoryMiddle: string;
    categorySmall: string;
    categoryDetail: string;
    inventoryType: string;
    standardPrice: number;
    standardCost: number;
    standardSpec: string;
  }>,
  slots: Array<{
    productKey: string;
    slotName: string;
    slotNumber: string;
    season: string;
    targetMatch: string;
    location: string;
    listPrice: number;
    cost: number;
    specDetail: string;
  }>,
) {
  const client = getSupabase();
  const productIdByKey = new Map<string, string>();
  let createdProducts = 0;
  let createdSlots = 0;

  for (const product of products) {
    const key = [product.categoryLarge, product.categoryMiddle, product.categorySmall, product.categoryDetail, product.inventoryType].join("|");
    const query = client
      .from("products")
      .select("id")
      .eq("organization_id", getOrganizationId())
      .eq("category_large", product.categoryLarge)
      .eq("category_middle", product.categoryMiddle)
      .eq("category_small", product.categorySmall)
      .eq("category_detail", product.categoryDetail)
      .eq("inventory_type", product.inventoryType)
      .maybeSingle();
    const existing = await query;
    if (existing.error) throw new Error(existing.error.message);

    if (existing.data?.id) {
      productIdByKey.set(key, String(existing.data.id));
      continue;
    }

    const { data, error } = await client
      .from("products")
      .insert(
        withOrganizationId({
          display_name: product.displayName,
          category_large: product.categoryLarge,
          category_middle: product.categoryMiddle,
          category_small: product.categorySmall,
          category_detail: product.categoryDetail,
          inventory_type: product.inventoryType,
          standard_price: product.standardPrice,
          standard_cost: product.standardCost,
          standard_spec: product.standardSpec,
        }),
      )
      .select("id")
      .single();
    const inserted = assertSingle(data, error);
    productIdByKey.set(key, String(inserted.id));
    createdProducts += 1;
  }

  const slotRows: SupabaseRecord[] = [];
  for (const slot of slots) {
    const productId = productIdByKey.get(slot.productKey);
    if (!productId) continue;
    slotRows.push(
      withOrganizationId({
        product_id: productId,
        slot_name: slot.slotName,
        slot_number: slot.slotNumber,
        season: slot.season,
        target_match: slot.targetMatch,
        location: slot.location,
        status: "未販売",
        company: "",
        owner: "",
        list_price: slot.listPrice,
        sales_price: 0,
        cost: slot.cost,
        production_due: "",
        production_status: "未着手",
        spec_detail: slot.specDetail,
        inspection_status: "未対応",
        evidence_urls: "",
        inspection_note: "",
        inspected_at: "",
      }),
    );
  }

  if (slotRows.length) {
    const { error } = await client.from("inventory_slots").insert(slotRows);
    if (error) throw new Error(error.message);
    createdSlots = slotRows.length;
  }

  return { createdProducts, createdSlots };
}

export async function createSupabaseProductAndSlot(input: {
  productMode: "existing" | "new";
  productId?: string;
  displayName: string;
  categoryLarge: string;
  categoryMiddle: string;
  categorySmall: string;
  categoryDetail: string;
  inventoryType: string;
  standardPrice: number;
  standardCost: number;
  standardSpec: string;
  slotName: string;
  slotNumber: string;
  season: string;
  targetMatch: string;
  location: string;
  status: string;
  company: string;
  owner: string;
  listPrice: number;
  salesPrice: number;
  cost: number;
  productionDue: string;
  productionStatus: string;
  specDetail: string;
}) {
  const client = getSupabase();
  let productId = input.productId || "";
  let createdProduct: DbProduct | null = null;

  if (input.productMode === "existing") {
    await assertProductBelongsToOrganization(client, productId);
  }

  if (input.productMode === "new") {
    const { data, error } = await client
      .from("products")
      .insert(
        withOrganizationId({
          display_name: input.displayName,
          category_large: input.categoryLarge,
          category_middle: input.categoryMiddle,
          category_small: input.categorySmall,
          category_detail: input.categoryDetail,
          inventory_type: input.inventoryType,
          standard_price: input.standardPrice,
          standard_cost: input.standardCost,
          standard_spec: input.standardSpec,
        }),
      )
      .select("*")
      .single();
    const product = assertSingle(data as SupabaseProduct | null, error);
    productId = product.id;
    createdProduct = productFromRow(product);
  }

  const { data, error } = await client
    .from("inventory_slots")
    .insert(
      withOrganizationId({
        product_id: productId,
        slot_name: input.slotName,
        slot_number: input.slotNumber,
        season: input.season,
        target_match: input.targetMatch,
        location: input.location,
        status: input.status,
        company: input.company,
        owner: input.owner,
        list_price: input.listPrice,
        sales_price: input.salesPrice,
        cost: input.cost,
        production_due: input.productionDue,
        production_status: input.productionStatus,
        spec_detail: input.specDetail,
        inspection_status: "未対応",
        evidence_urls: "",
        inspection_note: "",
        inspected_at: "",
      }),
    )
    .select("*")
    .single();

  const slot = assertSingle(data as SupabaseSlot | null, error);
  return {
    product: createdProduct,
    slot: slotFromRow(slot),
  };
}
