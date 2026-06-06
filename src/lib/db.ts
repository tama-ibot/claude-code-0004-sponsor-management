import Database from "better-sqlite3";
import path from "node:path";

export type DbProduct = {
  id: string;
  displayName: string;
  categoryLarge: string;
  categoryMiddle: string;
  categorySmall: string;
  categoryDetail: string;
  inventoryType: string;
  standardPrice: number;
  standardCost: number;
  standardSpec: string;
};

export type DbSlot = {
  id: string;
  productId: string;
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
  inspectionStatus: string;
  evidenceUrls: string;
  inspectionNote: string;
  inspectedAt: string;
};

export type DbCompany = {
  id: string;
  name: string;
  industry: string;
  owner: string;
  status: string;
  note: string;
};

export type DbProposal = {
  id: string;
  slotId: string;
  companyName: string;
  proposedDate: string;
  status: string;
  proposedPrice: number;
  owner: string;
  lostReason: string;
  note: string;
};

export type DbContract = {
  id: string;
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
};

export type DbContractItem = {
  id: string;
  contractId: string;
  slotId: string;
  itemName: string;
  allocatedAmount: number;
  cost: number;
  note: string;
};

export type DbReviewState = {
  id: string;
  reviewKey: string;
  reviewType: string;
  status: string;
  note: string;
};

export type DbShape = {
  products: DbProduct[];
  slots: DbSlot[];
  companies: DbCompany[];
  proposals: DbProposal[];
  contracts: DbContract[];
  contractItems: DbContractItem[];
  reviewStates: DbReviewState[];
};

const dbPath = path.join(process.cwd(), "data", "sponsorship.db");

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    initializeDb(db);
  }

  return db;
}

export function getAppData(): DbShape {
  const database = getDb();
  const products = database
    .prepare(
      `
      SELECT
        id,
        display_name as displayName,
        category_large as categoryLarge,
        category_middle as categoryMiddle,
        category_small as categorySmall,
        category_detail as categoryDetail,
        inventory_type as inventoryType,
        standard_price as standardPrice,
        standard_cost as standardCost,
        standard_spec as standardSpec
      FROM products
      ORDER BY category_large, category_middle, category_small, category_detail
    `,
    )
    .all() as DbProduct[];

  const slots = database
    .prepare(
      `
      SELECT
        id,
        product_id as productId,
        slot_name as slotName,
        slot_number as slotNumber,
        season,
        target_match as targetMatch,
        location,
        status,
        company,
        owner,
        list_price as listPrice,
        sales_price as salesPrice,
        cost,
        production_due as productionDue,
        production_status as productionStatus,
        spec_detail as specDetail,
        inspection_status as inspectionStatus,
        evidence_urls as evidenceUrls,
        inspection_note as inspectionNote,
        inspected_at as inspectedAt
      FROM inventory_slots
      ORDER BY created_at, slot_number
    `,
    )
    .all() as DbSlot[];

  const companies = database
    .prepare(
      `
      SELECT
        id,
        name,
        industry,
        owner,
        status,
        note
      FROM companies
      ORDER BY name
    `,
    )
    .all() as DbCompany[];

  const proposals = database
    .prepare(
      `
      SELECT
        id,
        slot_id as slotId,
        company_name as companyName,
        proposed_date as proposedDate,
        status,
        proposed_price as proposedPrice,
        owner,
        lost_reason as lostReason,
        note
      FROM proposals
      ORDER BY created_at DESC
    `,
    )
    .all() as DbProposal[];

  const contracts = database
    .prepare(
      `
      SELECT
        id,
        company_name as companyName,
        name,
        season,
        start_date as startDate,
        end_date as endDate,
        total_amount as totalAmount,
        status,
        billing_status as billingStatus,
        owner,
        note
      FROM contracts
      ORDER BY created_at DESC
    `,
    )
    .all() as DbContract[];

  const contractItems = database
    .prepare(
      `
      SELECT
        id,
        contract_id as contractId,
        slot_id as slotId,
        item_name as itemName,
        allocated_amount as allocatedAmount,
        cost,
        note
      FROM contract_items
      ORDER BY created_at
    `,
    )
    .all() as DbContractItem[];

  const reviewStates = database
    .prepare(
      `
      SELECT
        id,
        review_key as reviewKey,
        review_type as reviewType,
        status,
        note
      FROM review_states
      ORDER BY updated_at DESC
    `,
    )
    .all() as DbReviewState[];

  return { products, slots, companies, proposals, contracts, contractItems, reviewStates };
}

export function updateSlotRecord(
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
  const database = getDb();
  const current = database.prepare("SELECT * FROM inventory_slots WHERE id = ?").get(slotId) as
    | {
        status: string;
        company: string;
        sales_price: number;
        production_status: string;
        inspection_status: string;
        evidence_urls: string;
        inspection_note: string;
        inspected_at: string;
      }
    | undefined;

  if (!current) return;

  database
    .prepare(
      `
      UPDATE inventory_slots
      SET
        status = ?,
        company = ?,
        sales_price = ?,
        production_status = ?,
        inspection_status = ?,
        evidence_urls = ?,
        inspection_note = ?,
        inspected_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `,
    )
    .run(
      patch.status ?? current.status,
      patch.company ?? current.company,
      patch.salesPrice ?? current.sales_price,
      patch.productionStatus ?? current.production_status,
      patch.inspectionStatus ?? current.inspection_status,
      patch.evidenceUrls ?? current.evidence_urls,
      patch.inspectionNote ?? current.inspection_note,
      patch.inspectedAt ?? current.inspected_at,
      slotId,
    );
}

export function createCompanyRecord(input: {
  name: string;
  industry: string;
  owner: string;
  status: string;
  note: string;
}) {
  const database = getDb();
  const existing = database.prepare("SELECT id FROM companies WHERE name = ?").get(input.name) as { id: string } | undefined;
  if (existing) {
    return database
      .prepare(
        `
        SELECT id, name, industry, owner, status, note
        FROM companies
        WHERE id = ?
      `,
      )
      .get(existing.id) as DbCompany;
  }

  const id = crypto.randomUUID();
  database
    .prepare(
      `
      INSERT INTO companies (id, name, industry, owner, status, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    )
    .run(id, input.name, input.industry, input.owner, input.status, input.note);

  return {
    id,
    name: input.name,
    industry: input.industry,
    owner: input.owner,
    status: input.status,
    note: input.note,
  };
}

export function createProposalRecord(input: {
  slotId: string;
  companyName: string;
  proposedDate: string;
  status: string;
  proposedPrice: number;
  owner: string;
  lostReason: string;
  note: string;
}) {
  const database = getDb();
  const id = crypto.randomUUID();
  database
    .prepare(
      `
      INSERT INTO proposals (
        id,
        slot_id,
        company_name,
        proposed_date,
        status,
        proposed_price,
        owner,
        lost_reason,
        note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      id,
      input.slotId,
      input.companyName,
      input.proposedDate,
      input.status,
      input.proposedPrice,
      input.owner,
      input.lostReason,
      input.note,
    );

  return {
    id,
    slotId: input.slotId,
    companyName: input.companyName,
    proposedDate: input.proposedDate,
    status: input.status,
    proposedPrice: input.proposedPrice,
    owner: input.owner,
    lostReason: input.lostReason,
    note: input.note,
  };
}

export function createContractRecord(input: {
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
  const database = getDb();
  const contractId = crypto.randomUUID();
  const insertContract = database.prepare(`
    INSERT INTO contracts (
      id,
      company_name,
      name,
      season,
      start_date,
      end_date,
      total_amount,
      status,
      billing_status,
      owner,
      note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertContractItem = database.prepare(`
    INSERT INTO contract_items (
      id,
      contract_id,
      slot_id,
      item_name,
      allocated_amount,
      cost,
      note
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const updateSlot = database.prepare(`
    UPDATE inventory_slots
    SET
      status = '契約済み',
      company = ?,
      sales_price = CASE WHEN ? > 0 THEN ? ELSE sales_price END,
      updated_at = datetime('now')
    WHERE id = ?
  `);

  const items: DbContractItem[] = [];
  database.transaction(() => {
    insertContract.run(
      contractId,
      input.companyName,
      input.name,
      input.season,
      input.startDate,
      input.endDate,
      input.totalAmount,
      input.status,
      input.billingStatus,
      input.owner,
      input.note,
    );

    for (const item of input.items) {
      const itemId = crypto.randomUUID();
      insertContractItem.run(itemId, contractId, item.slotId, item.itemName, item.allocatedAmount, item.cost, item.note);
      updateSlot.run(input.companyName, item.allocatedAmount, item.allocatedAmount, item.slotId);
      items.push({
        id: itemId,
        contractId,
        slotId: item.slotId,
        itemName: item.itemName,
        allocatedAmount: item.allocatedAmount,
        cost: item.cost,
        note: item.note,
      });
    }
  })();

  return {
    contract: {
      id: contractId,
      companyName: input.companyName,
      name: input.name,
      season: input.season,
      startDate: input.startDate,
      endDate: input.endDate,
      totalAmount: input.totalAmount,
      status: input.status,
      billingStatus: input.billingStatus,
      owner: input.owner,
      note: input.note,
    },
    items,
  };
}

export function upsertReviewStateRecord(input: {
  reviewKey: string;
  reviewType: string;
  status: string;
  note: string;
}) {
  const database = getDb();
  const existing = database.prepare("SELECT id FROM review_states WHERE review_key = ?").get(input.reviewKey) as { id: string } | undefined;
  const id = existing?.id || crypto.randomUUID();

  if (existing) {
    database
      .prepare(
        `
        UPDATE review_states
        SET
          review_type = ?,
          status = ?,
          note = ?,
          updated_at = datetime('now')
        WHERE review_key = ?
      `,
      )
      .run(input.reviewType, input.status, input.note, input.reviewKey);
  } else {
    database
      .prepare(
        `
        INSERT INTO review_states (id, review_key, review_type, status, note)
        VALUES (?, ?, ?, ?, ?)
      `,
      )
      .run(id, input.reviewKey, input.reviewType, input.status, input.note);
  }

  return {
    id,
    reviewKey: input.reviewKey,
    reviewType: input.reviewType,
    status: input.status,
    note: input.note,
  };
}

export function insertImportedData(
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
  const database = getDb();
  const productIdByKey = new Map<string, string>();
  let createdProducts = 0;
  let createdSlots = 0;

  const findProduct = database.prepare(`
    SELECT id
    FROM products
    WHERE category_large = ?
      AND category_middle = ?
      AND category_small = ?
      AND category_detail = ?
      AND inventory_type = ?
  `);
  const insertProduct = database.prepare(`
    INSERT INTO products (
      id,
      display_name,
      category_large,
      category_middle,
      category_small,
      category_detail,
      inventory_type,
      standard_price,
      standard_cost,
      standard_spec
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSlot = database.prepare(`
    INSERT INTO inventory_slots (
      id,
      product_id,
      slot_name,
      slot_number,
      season,
      target_match,
      location,
      status,
      company,
      owner,
      list_price,
      sales_price,
      cost,
      production_due,
      production_status,
      spec_detail,
      inspection_status,
      evidence_urls,
      inspection_note,
      inspected_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, '未販売', '', '', ?, 0, ?, '', '未着手', ?, '未対応', '', '', '')
  `);

  database.transaction(() => {
    for (const product of products) {
      const key = [
        product.categoryLarge,
        product.categoryMiddle,
        product.categorySmall,
        product.categoryDetail,
        product.inventoryType,
      ].join("|");
      const existing = findProduct.get(
        product.categoryLarge,
        product.categoryMiddle,
        product.categorySmall,
        product.categoryDetail,
        product.inventoryType,
      ) as { id: string } | undefined;

      const productId = existing?.id ?? crypto.randomUUID();
      if (!existing) {
        insertProduct.run(
          productId,
          product.displayName,
          product.categoryLarge,
          product.categoryMiddle,
          product.categorySmall,
          product.categoryDetail,
          product.inventoryType,
          product.standardPrice,
          product.standardCost,
          product.standardSpec,
        );
        createdProducts += 1;
      }
      productIdByKey.set(key, productId);
    }

    for (const slot of slots) {
      const productId = productIdByKey.get(slot.productKey);
      if (!productId) continue;

      insertSlot.run(
        crypto.randomUUID(),
        productId,
        slot.slotName,
        slot.slotNumber,
        slot.season,
        slot.targetMatch,
        slot.location,
        slot.listPrice,
        slot.cost,
        slot.specDetail,
      );
      createdSlots += 1;
    }
  })();

  return { createdProducts, createdSlots };
}

export type CreateProductAndSlotResult = {
  product: DbProduct | null;
  slot: DbSlot;
};

export function createProductAndSlot(input: {
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
}): CreateProductAndSlotResult {
  const database = getDb();
  const findProduct = database.prepare(`
    SELECT id
    FROM products
    WHERE category_large = ?
      AND category_middle = ?
      AND category_small = ?
      AND category_detail = ?
      AND inventory_type = ?
  `);
  const insertProduct = database.prepare(`
    INSERT INTO products (
      id,
      display_name,
      category_large,
      category_middle,
      category_small,
      category_detail,
      inventory_type,
      standard_price,
      standard_cost,
      standard_spec
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSlot = database.prepare(`
    INSERT INTO inventory_slots (
      id,
      product_id,
      slot_name,
      slot_number,
      season,
      target_match,
      location,
      status,
      company,
      owner,
      list_price,
      sales_price,
      cost,
      production_due,
      production_status,
      spec_detail,
      inspection_status,
      evidence_urls,
      inspection_note,
      inspected_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '未対応', '', '', '')
  `);

  let productId = input.productId || "";
  let createdProduct: DbProduct | null = null;

  database.transaction(() => {
    if (input.productMode === "new") {
      const existing = findProduct.get(
        input.categoryLarge,
        input.categoryMiddle,
        input.categorySmall,
        input.categoryDetail,
        input.inventoryType,
      ) as { id: string } | undefined;

      productId = existing?.id ?? crypto.randomUUID();
      if (!existing) {
        insertProduct.run(
          productId,
          input.displayName,
          input.categoryLarge,
          input.categoryMiddle,
          input.categorySmall,
          input.categoryDetail,
          input.inventoryType,
          input.standardPrice,
          input.standardCost,
          input.standardSpec,
        );
        createdProduct = {
          id: productId,
          displayName: input.displayName,
          categoryLarge: input.categoryLarge,
          categoryMiddle: input.categoryMiddle,
          categorySmall: input.categorySmall,
          categoryDetail: input.categoryDetail,
          inventoryType: input.inventoryType,
          standardPrice: input.standardPrice,
          standardCost: input.standardCost,
          standardSpec: input.standardSpec,
        };
      }
    }

    if (!productId) {
      throw new Error("productId is required");
    }

    insertSlot.run(
      crypto.randomUUID(),
      productId,
      input.slotName,
      input.slotNumber,
      input.season,
      input.targetMatch,
      input.location,
      input.status,
      input.company,
      input.owner,
      input.listPrice,
      input.salesPrice,
      input.cost,
      input.productionDue,
      input.productionStatus,
      input.specDetail,
    );
  })();

  return {
    product: createdProduct,
    slot: getDb()
      .prepare(
        `
        SELECT
          id,
          product_id as productId,
          slot_name as slotName,
          slot_number as slotNumber,
          season,
          target_match as targetMatch,
          location,
          status,
          company,
          owner,
          list_price as listPrice,
          sales_price as salesPrice,
          cost,
          production_due as productionDue,
          production_status as productionStatus,
          spec_detail as specDetail,
          inspection_status as inspectionStatus,
          evidence_urls as evidenceUrls,
          inspection_note as inspectionNote,
          inspected_at as inspectedAt
        FROM inventory_slots
        WHERE product_id = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
      )
      .get(productId) as DbSlot,
  };
}

function initializeDb(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      category_large TEXT NOT NULL,
      category_middle TEXT NOT NULL DEFAULT '',
      category_small TEXT NOT NULL DEFAULT '',
      category_detail TEXT NOT NULL DEFAULT '',
      inventory_type TEXT NOT NULL,
      standard_price INTEGER NOT NULL DEFAULT 0,
      standard_cost INTEGER NOT NULL DEFAULT 0,
      standard_spec TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(category_large, category_middle, category_small, category_detail, inventory_type)
    );

    CREATE TABLE IF NOT EXISTS inventory_slots (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      slot_name TEXT NOT NULL,
      slot_number TEXT NOT NULL DEFAULT '',
      season TEXT NOT NULL DEFAULT '2026-27',
      target_match TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '未販売',
      company TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL DEFAULT '',
      list_price INTEGER NOT NULL DEFAULT 0,
      sales_price INTEGER NOT NULL DEFAULT 0,
      cost INTEGER NOT NULL DEFAULT 0,
      production_due TEXT NOT NULL DEFAULT '',
      production_status TEXT NOT NULL DEFAULT '未着手',
      spec_detail TEXT NOT NULL DEFAULT '',
      inspection_status TEXT NOT NULL DEFAULT '未対応',
      evidence_urls TEXT NOT NULL DEFAULT '',
      inspection_note TEXT NOT NULL DEFAULT '',
      inspected_at TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_inventory_slots_product_id ON inventory_slots(product_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_slots_season ON inventory_slots(season);
    CREATE INDEX IF NOT EXISTS idx_inventory_slots_status ON inventory_slots(status);

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      industry TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '提案先',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies(owner);
    CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

    CREATE TABLE IF NOT EXISTS proposals (
      id TEXT PRIMARY KEY,
      slot_id TEXT NOT NULL,
      company_name TEXT NOT NULL,
      proposed_date TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT '提案中',
      proposed_price INTEGER NOT NULL DEFAULT 0,
      owner TEXT NOT NULL DEFAULT '',
      lost_reason TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(slot_id) REFERENCES inventory_slots(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_proposals_slot_id ON proposals(slot_id);
    CREATE INDEX IF NOT EXISTS idx_proposals_company_name ON proposals(company_name);
    CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);

    CREATE TABLE IF NOT EXISTS contracts (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      name TEXT NOT NULL,
      season TEXT NOT NULL DEFAULT '2026-27',
      start_date TEXT NOT NULL DEFAULT '',
      end_date TEXT NOT NULL DEFAULT '',
      total_amount INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT '契約済み',
      billing_status TEXT NOT NULL DEFAULT '未請求',
      owner TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contract_items (
      id TEXT PRIMARY KEY,
      contract_id TEXT NOT NULL,
      slot_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      allocated_amount INTEGER NOT NULL DEFAULT 0,
      cost INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
      FOREIGN KEY(slot_id) REFERENCES inventory_slots(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_contracts_company_name ON contracts(company_name);
    CREATE INDEX IF NOT EXISTS idx_contracts_season ON contracts(season);
    CREATE INDEX IF NOT EXISTS idx_contract_items_contract_id ON contract_items(contract_id);
    CREATE INDEX IF NOT EXISTS idx_contract_items_slot_id ON contract_items(slot_id);

    CREATE TABLE IF NOT EXISTS review_states (
      id TEXT PRIMARY KEY,
      review_key TEXT NOT NULL UNIQUE,
      review_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '未確認',
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_review_states_review_type ON review_states(review_type);
    CREATE INDEX IF NOT EXISTS idx_review_states_status ON review_states(status);
  `);

  ensureColumn(database, "inventory_slots", "inspection_status", "TEXT NOT NULL DEFAULT '未対応'");
  ensureColumn(database, "inventory_slots", "evidence_urls", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "inventory_slots", "inspection_note", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(database, "inventory_slots", "inspected_at", "TEXT NOT NULL DEFAULT ''");

  const productCount = database.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  if (productCount.count === 0) {
    seedInitialData(database);
  }

  seedCompaniesFromSlots(database);
  seedProposalsFromSlots(database);
}

function ensureColumn(database: Database.Database, tableName: string, columnName: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  if (columns.some((column) => column.name === columnName)) return;
  database.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
}

function seedInitialData(database: Database.Database) {
  const products = [
    {
      id: "p-001",
      displayName: "コートサイドパネル サイド側",
      categoryLarge: "露出",
      categoryMiddle: "会場",
      categorySmall: "コートサイド",
      categoryDetail: "パネル サイド側",
      inventoryType: "シーズン枠",
      standardPrice: 3000000,
      standardCost: 450000,
      standardSpec: "レギュラーシーズン ホームゲーム掲出",
    },
    {
      id: "p-002",
      displayName: "会場ブース出展",
      categoryLarge: "アクティベーション",
      categoryMiddle: "会場",
      categorySmall: "ブース",
      categoryDetail: "日付",
      inventoryType: "試合日枠",
      standardPrice: 250000,
      standardCost: 50000,
      standardSpec: "1試合1ブース。場所は運営調整",
    },
    {
      id: "p-003",
      displayName: "センタービジョンCM 15秒",
      categoryLarge: "露出",
      categoryMiddle: "会場",
      categorySmall: "その他会場広告",
      categoryDetail: "センタービジョンCM",
      inventoryType: "時間枠",
      standardPrice: 500000,
      standardCost: 80000,
      standardSpec: "15秒素材。試合前中または試合後",
    },
    {
      id: "p-004",
      displayName: "ホームゲーム観戦チケット 1階指定席",
      categoryLarge: "ホスピタリティ",
      categoryMiddle: "会場",
      categorySmall: "チケット",
      categoryDetail: "1階指定席",
      inventoryType: "数量枠",
      standardPrice: 6000,
      standardCost: 3000,
      standardSpec: "枚数単位で提供",
    },
  ];
  const slots = [
    ["s-001", "p-001", "コートサイドパネル サイド側 1", "1", "2026-27", "レギュラーシーズン ホームゲーム", "コートサイド 中継側", "契約済み", "福岡サンプル株式会社", "営業A", 3000000, 2800000, 450000, "2026-09-20", "制作中", "W1800 x H900想定"],
    ["s-002", "p-001", "コートサイドパネル サイド側 2", "2", "2026-27", "レギュラーシーズン ホームゲーム", "コートサイド 中継側", "提案中", "九州パートナー社", "営業B", 3000000, 3000000, 450000, "2026-09-20", "未着手", "W1800 x H900想定"],
    ["s-003", "p-002", "10/10 愛媛戦 ブース枠 1", "1", "2026-27", "10/10 vs 愛媛 @ 照葉", "コンコース", "仮押さえ", "照葉食品", "営業A", 250000, 220000, 50000, "2026-10-01", "制作不要", "長机2本、椅子4脚"],
    ["s-004", "p-002", "10/10 愛媛戦 ブース枠 2", "2", "2026-27", "10/10 vs 愛媛 @ 照葉", "コンコース", "未販売", "", "営業C", 250000, 0, 50000, "", "制作不要", "長机2本、椅子4脚"],
    ["s-005", "p-003", "センタービジョンCM 15秒 試合前中", "1", "2026-27", "10/11 vs 愛媛 @ 照葉", "センタービジョン", "提案中", "映像スポンサー候補", "営業B", 500000, 450000, 80000, "2026-09-30", "素材待ち", "15秒、mp4入稿"],
    ["s-006", "p-004", "1階指定席 120枚", "120", "2026-27", "ホームゲーム", "1階指定席", "契約済み", "トップパートナー社", "営業A", 720000, 720000, 360000, "", "制作不要", "120枚提供"],
  ];

  const insertProduct = database.prepare(`
    INSERT INTO products (
      id,
      display_name,
      category_large,
      category_middle,
      category_small,
      category_detail,
      inventory_type,
      standard_price,
      standard_cost,
      standard_spec
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSlot = database.prepare(`
    INSERT INTO inventory_slots (
      id,
      product_id,
      slot_name,
      slot_number,
      season,
      target_match,
      location,
      status,
      company,
      owner,
      list_price,
      sales_price,
      cost,
      production_due,
      production_status,
      spec_detail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  database.transaction(() => {
    for (const product of products) {
      insertProduct.run(
        product.id,
        product.displayName,
        product.categoryLarge,
        product.categoryMiddle,
        product.categorySmall,
        product.categoryDetail,
        product.inventoryType,
        product.standardPrice,
        product.standardCost,
        product.standardSpec,
      );
    }
    for (const slot of slots) {
      insertSlot.run(...slot);
    }
  })();
}

function seedCompaniesFromSlots(database: Database.Database) {
  const companyCount = database.prepare("SELECT COUNT(*) as count FROM companies").get() as { count: number };
  if (companyCount.count > 0) return;

  const rows = database
    .prepare(
      `
      SELECT DISTINCT company, owner
      FROM inventory_slots
      WHERE company != ''
      ORDER BY company
    `,
    )
    .all() as Array<{ company: string; owner: string }>;
  const insertCompany = database.prepare(`
    INSERT OR IGNORE INTO companies (id, name, industry, owner, status, note)
    VALUES (?, ?, '', ?, '提案先', '')
  `);

  database.transaction(() => {
    for (const row of rows) {
      insertCompany.run(crypto.randomUUID(), row.company, row.owner);
    }
  })();
}

function seedProposalsFromSlots(database: Database.Database) {
  const proposalCount = database.prepare("SELECT COUNT(*) as count FROM proposals").get() as { count: number };
  if (proposalCount.count > 0) return;

  const rows = database
    .prepare(
      `
      SELECT id, company, owner, sales_price, list_price, status
      FROM inventory_slots
      WHERE company != ''
        AND status IN ('提案中', '仮押さえ', '契約済み')
      ORDER BY created_at
    `,
    )
    .all() as Array<{ id: string; company: string; owner: string; sales_price: number; list_price: number; status: string }>;
  const insertProposal = database.prepare(`
    INSERT INTO proposals (
      id,
      slot_id,
      company_name,
      proposed_date,
      status,
      proposed_price,
      owner,
      lost_reason,
      note
    ) VALUES (?, ?, ?, '', ?, ?, ?, '', '販売枠から自動作成')
  `);

  database.transaction(() => {
    for (const row of rows) {
      insertProposal.run(
        crypto.randomUUID(),
        row.id,
        row.company,
        row.status === "契約済み" ? "受注" : row.status,
        row.sales_price || row.list_price,
        row.owner,
      );
    }
  })();
}
