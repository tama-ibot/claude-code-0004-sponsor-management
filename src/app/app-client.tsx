"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createCompany,
  createContract,
  createProposal,
  createSlot,
  importProductsAndSlots,
  upsertReviewState,
  updateInventorySlot,
  type CreateCompanyInput,
  type CreateContractInput,
  type CreateProposalInput,
  type CreateSlotInput,
  type ImportedProductInput,
  type ImportedSlotInput,
  type UpsertReviewStateInput,
} from "./actions";

type InventoryType = "シーズン枠" | "試合日枠" | "数量枠" | "時間枠" | "案件型";
type SlotStatus =
  | "未販売"
  | "提案中"
  | "仮押さえ"
  | "契約済み"
  | "制作中"
  | "実施済み"
  | "請求済み"
  | "完了"
  | "失注";
type ProductionStatus =
  | "制作不要"
  | "未着手"
  | "素材待ち"
  | "制作中"
  | "確認中"
  | "校了"
  | "制作完了";
type InspectionStatus = "未対応" | "確認中" | "完了";

export type Product = {
  id: string;
  displayName: string;
  categoryLarge: string;
  categoryMiddle: string;
  categorySmall: string;
  categoryDetail: string;
  inventoryType: InventoryType;
  standardPrice: number;
  standardCost: number;
  standardSpec: string;
};

export type Slot = {
  id: string;
  productId: string;
  slotName: string;
  slotNumber: string;
  season: string;
  targetMatch: string;
  location: string;
  status: SlotStatus;
  company: string;
  owner: string;
  listPrice: number;
  salesPrice: number;
  cost: number;
  productionDue: string;
  productionStatus: ProductionStatus;
  specDetail: string;
  inspectionStatus: InspectionStatus;
  evidenceUrls: string;
  inspectionNote: string;
  inspectedAt: string;
};

export type Company = {
  id: string;
  name: string;
  industry: string;
  owner: string;
  status: string;
  note: string;
};

export type Proposal = {
  id: string;
  slotId: string;
  companyName: string;
  proposedDate: string;
  status: "提案中" | "受注" | "失注" | "保留" | "仮押さえ";
  proposedPrice: number;
  owner: string;
  lostReason: string;
  note: string;
};

export type Contract = {
  id: string;
  companyName: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: "契約済み" | "契約準備" | "終了";
  billingStatus: "未請求" | "請求済み" | "入金済み";
  owner: string;
  note: string;
};

export type ContractItem = {
  id: string;
  contractId: string;
  slotId: string;
  itemName: string;
  allocatedAmount: number;
  cost: number;
  note: string;
};

const statusOptions: SlotStatus[] = [
  "未販売",
  "提案中",
  "仮押さえ",
  "契約済み",
  "制作中",
  "実施済み",
  "請求済み",
  "完了",
  "失注",
];

const productionOptions: ProductionStatus[] = [
  "制作不要",
  "未着手",
  "素材待ち",
  "制作中",
  "確認中",
  "校了",
  "制作完了",
];

const inspectionOptions: InspectionStatus[] = ["未対応", "確認中", "完了"];

const inventoryTypeOptions: InventoryType[] = ["シーズン枠", "試合日枠", "数量枠", "時間枠", "案件型"];

type CreateForm = {
  productMode: "existing" | "new";
  productId: string;
  displayName: string;
  categoryLarge: string;
  categoryMiddle: string;
  categorySmall: string;
  categoryDetail: string;
  inventoryType: InventoryType;
  standardPrice: string;
  standardCost: string;
  standardSpec: string;
  slotName: string;
  slotNumber: string;
  season: string;
  targetMatch: string;
  location: string;
  status: SlotStatus;
  company: string;
  owner: string;
  listPrice: string;
  salesPrice: string;
  cost: string;
  productionDue: string;
  productionStatus: ProductionStatus;
  specDetail: string;
};

type CompanyForm = {
  name: string;
  industry: string;
  owner: string;
  status: string;
  note: string;
};

type ProposalForm = {
  companyName: string;
  proposedDate: string;
  status: Proposal["status"];
  proposedPrice: string;
  owner: string;
  lostReason: string;
  note: string;
};

type ContractForm = {
  companyName: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  status: Contract["status"];
  billingStatus: Contract["billingStatus"];
  owner: string;
  note: string;
  selectedSlotIds: string[];
};

type ReviewStatus = "未確認" | "同一候補" | "別物" | "保留";

export type ReviewState = {
  status: ReviewStatus;
  note: string;
};

export type CurrentUser = {
  name: string;
  role: "sales" | "manager" | "ops" | "admin";
};

const reviewStatusOptions: ReviewStatus[] = ["未確認", "同一候補", "別物", "保留"];

const seedProducts: Product[] = [
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

const seedSlots: Slot[] = [
  {
    id: "s-001",
    productId: "p-001",
    slotName: "コートサイドパネル サイド側 1",
    slotNumber: "1",
    season: "2026-27",
    targetMatch: "レギュラーシーズン ホームゲーム",
    location: "コートサイド 中継側",
    status: "契約済み",
    company: "福岡サンプル株式会社",
    owner: "営業A",
    listPrice: 3000000,
    salesPrice: 2800000,
    cost: 450000,
    productionDue: "2026-09-20",
    productionStatus: "制作中",
    specDetail: "W1800 x H900想定",
    inspectionStatus: "確認中",
    evidenceUrls: "https://example.com/panel-photo",
    inspectionNote: "初回掲出写真を確認中",
    inspectedAt: "",
  },
  {
    id: "s-002",
    productId: "p-001",
    slotName: "コートサイドパネル サイド側 2",
    slotNumber: "2",
    season: "2026-27",
    targetMatch: "レギュラーシーズン ホームゲーム",
    location: "コートサイド 中継側",
    status: "提案中",
    company: "九州パートナー社",
    owner: "営業B",
    listPrice: 3000000,
    salesPrice: 3000000,
    cost: 450000,
    productionDue: "2026-09-20",
    productionStatus: "未着手",
    specDetail: "W1800 x H900想定",
    inspectionStatus: "未対応",
    evidenceUrls: "",
    inspectionNote: "",
    inspectedAt: "",
  },
  {
    id: "s-003",
    productId: "p-002",
    slotName: "10/10 愛媛戦 ブース枠 1",
    slotNumber: "1",
    season: "2026-27",
    targetMatch: "10/10 vs 愛媛 @ 照葉",
    location: "コンコース",
    status: "仮押さえ",
    company: "照葉食品",
    owner: "営業A",
    listPrice: 250000,
    salesPrice: 220000,
    cost: 50000,
    productionDue: "2026-10-01",
    productionStatus: "制作不要",
    specDetail: "長机2本、椅子4脚",
    inspectionStatus: "未対応",
    evidenceUrls: "",
    inspectionNote: "",
    inspectedAt: "",
  },
  {
    id: "s-004",
    productId: "p-002",
    slotName: "10/10 愛媛戦 ブース枠 2",
    slotNumber: "2",
    season: "2026-27",
    targetMatch: "10/10 vs 愛媛 @ 照葉",
    location: "コンコース",
    status: "未販売",
    company: "",
    owner: "営業C",
    listPrice: 250000,
    salesPrice: 0,
    cost: 50000,
    productionDue: "",
    productionStatus: "制作不要",
    specDetail: "長机2本、椅子4脚",
    inspectionStatus: "未対応",
    evidenceUrls: "",
    inspectionNote: "",
    inspectedAt: "",
  },
  {
    id: "s-005",
    productId: "p-003",
    slotName: "センタービジョンCM 15秒 試合前中",
    slotNumber: "1",
    season: "2026-27",
    targetMatch: "10/11 vs 愛媛 @ 照葉",
    location: "センタービジョン",
    status: "提案中",
    company: "映像スポンサー候補",
    owner: "営業B",
    listPrice: 500000,
    salesPrice: 450000,
    cost: 80000,
    productionDue: "2026-09-30",
    productionStatus: "素材待ち",
    specDetail: "15秒、mp4入稿",
    inspectionStatus: "未対応",
    evidenceUrls: "",
    inspectionNote: "",
    inspectedAt: "",
  },
  {
    id: "s-006",
    productId: "p-004",
    slotName: "1階指定席 120枚",
    slotNumber: "120",
    season: "2026-27",
    targetMatch: "ホームゲーム",
    location: "1階指定席",
    status: "契約済み",
    company: "トップパートナー社",
    owner: "営業A",
    listPrice: 720000,
    salesPrice: 720000,
    cost: 360000,
    productionDue: "",
    productionStatus: "制作不要",
    specDetail: "120枚提供",
    inspectionStatus: "完了",
    evidenceUrls: "https://example.com/ticket-delivery",
    inspectionNote: "チケット提供記録URLを確認済み",
    inspectedAt: "2026-10-15",
  },
];

function currency(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function roleLabel(role: CurrentUser["role"]) {
  const labels: Record<CurrentUser["role"], string> = {
    sales: "営業担当",
    manager: "営業マネージャー",
    ops: "運営担当",
    admin: "管理者",
  };
  return labels[role];
}

function marginRate(salesPrice: number, cost: number) {
  if (!salesPrice) return "-";
  return `${Math.round(((salesPrice - cost) / salesPrice) * 100)}%`;
}

function productKey(product: Product) {
  return [
    product.categoryLarge,
    product.categoryMiddle,
    product.categorySmall,
    product.categoryDetail,
    product.inventoryType,
  ]
    .map((value) => value.trim())
    .join("|");
}

function looseTextKey(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[＜＞<>（）()\[\]【】]/g, "")
    .replace(/\s+/g, "")
    .replace(/[①②③④⑤⑥⑦⑧⑨⑩]/g, "")
    .toLowerCase();
}

function looseProductKey(product: Product) {
  return [
    product.categoryLarge,
    product.categoryMiddle,
    product.categorySmall,
    product.categoryDetail,
    product.inventoryType,
  ]
    .map(looseTextKey)
    .join("|");
}

function looseCompanyKey(name: string) {
  return looseTextKey(name)
    .replace(/株式会社/g, "")
    .replace(/有限会社/g, "")
    .replace(/合同会社/g, "")
    .replace(/一般社団法人/g, "")
    .replace(/公益社団法人/g, "")
    .replace(/一般財団法人/g, "")
    .replace(/公益財団法人/g, "")
    .replace(/学校法人/g, "")
    .replace(/医療法人/g, "")
    .replace(/社会福祉法人/g, "")
    .replace(/㈱/g, "")
    .replace(/㈲/g, "")
    .replace(/inc\.?|corp\.?|co\.?ltd\.?|ltd\.?/g, "");
}

function statusClass(status: SlotStatus) {
  const map: Record<SlotStatus, string> = {
    未販売: "bg-slate-100 text-slate-700 ring-slate-200",
    提案中: "bg-sky-50 text-sky-700 ring-sky-200",
    仮押さえ: "bg-amber-50 text-amber-800 ring-amber-200",
    契約済み: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    制作中: "bg-violet-50 text-violet-700 ring-violet-200",
    実施済み: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    請求済み: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    完了: "bg-zinc-900 text-white ring-zinc-900",
    失注: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return map[status];
}

function inspectionClass(status: InspectionStatus) {
  const map: Record<InspectionStatus, string> = {
    未対応: "bg-slate-100 text-slate-700 ring-slate-200",
    確認中: "bg-amber-50 text-amber-800 ring-amber-200",
    完了: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };
  return map[status];
}

function extractUrls(value: string) {
  return value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item));
}

function parseSlotDate(slot: Slot) {
  const source = `${slot.targetMatch} ${slot.slotName}`;
  const match = source.match(/(\d{1,2})\s*(?:\/|月)\s*(\d{1,2})/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  if (!month || !day || month > 12 || day > 31) return null;

  const seasonStart = parseSeasonStartYear(slot.season);
  const year = month >= 7 ? seasonStart : seasonStart + 1;
  const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return {
    dateKey,
    dateLabel: `${month}/${day}`,
    monthLabel: `${year}年${month}月`,
  };
}

function parseSeasonStartYear(season: string) {
  const match = season.match(/(\d{2,4})/);
  if (!match) return 2026;
  const value = Number(match[1]);
  if (value < 100) return 2000 + value;
  return value;
}

function detectDelimiter(line: string) {
  const tabCount = (line.match(/\t/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  return tabCount > commaCount ? "\t" : ",";
}

function parseDelimitedLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseAmount(value: string) {
  const normalized = value.replace(/[¥円,\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeInventoryType(value: string): InventoryType {
  if (["シーズン枠", "試合日枠", "数量枠", "時間枠", "案件型"].includes(value)) {
    return value as InventoryType;
  }
  return "シーズン枠";
}

function normalizeHeader(value: string) {
  return value.replace(/\s/g, "").replace(/＿/g, "_").replace(/[（）()]/g, "").toLowerCase();
}

function inferInventoryType(categoryLarge: string, categorySmall: string, categoryDetail: string, explicitValue: string): InventoryType {
  const normalized = normalizeInventoryType(explicitValue);
  if (explicitValue) return normalized;

  const source = `${categoryLarge} ${categorySmall} ${categoryDetail}`;
  if (/ブース|サンプリング|冠試合|前座|日付|観戦会/.test(source)) return "試合日枠";
  if (/ビジョン|cm|CM|秒/.test(source)) return "時間枠";
  if (/チケット|枚|席|ボール|自由帳|グッズ|寄贈/.test(source)) return "数量枠";
  if (/協業|Project|稼働|派遣|制作|動画/.test(source)) return "案件型";
  return "シーズン枠";
}

function productDisplayName(categoryLarge: string, categoryMiddle: string, categorySmall: string, categoryDetail: string) {
  return [categoryLarge, categoryMiddle, categorySmall, categoryDetail].filter(Boolean).join(" / ");
}

function getRowValue(row: string[], headerIndex: Map<string, number>, aliases: string[]) {
  for (const alias of aliases) {
    const index = headerIndex.get(normalizeHeader(alias));
    if (index !== undefined) return row[index] || "";
  }
  return "";
}

type CsvBuildResult = {
  products: Product[];
  slots: Slot[];
  actionProducts: ImportedProductInput[];
  actionSlots: ImportedSlotInput[];
  warnings: string[];
};

function buildImportedRows(csv: string, existingProducts: Product[], existingSlots: Slot[]): CsvBuildResult {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return {
      products: [],
      slots: [],
      actionProducts: [],
      actionSlots: [],
      warnings: ["CSVにデータ行がありません。"],
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const firstRow = parseDelimitedLine(lines[0], delimiter);
  const normalizedFirstRow = firstRow.map(normalizeHeader);
  const hasHeader = normalizedFirstRow.some((header) =>
    ["商品分類_大", "商品分類大", "表示商品名", "枠名", "在庫タイプ"].map(normalizeHeader).includes(header),
  );
  const headers = hasHeader ? firstRow : ["商品分類_大", "商品分類_中", "商品分類_小", "商品分類_詳細"];
  const rows = (hasHeader ? lines.slice(1) : lines).map((line) => parseDelimitedLine(line, delimiter));
  const headerIndex = new Map(headers.map((header, index) => [normalizeHeader(header), index]));
  const get = (row: string[], aliases: string[]) => getRowValue(row, headerIndex, aliases);
  const products = [...existingProducts];
  const slots = [...existingSlots];
  const importedProducts: Product[] = [];
  const importedSlots: Slot[] = [];
  const actionProductByKey = new Map<string, ImportedProductInput>();
  const actionSlots: ImportedSlotInput[] = [];
  const warnings: string[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + (hasHeader ? 2 : 1);
    const categoryLarge = get(row, ["商品分類_大", "商品分類大", "分類_大", "分類大", "大分類"]);
    const categoryMiddle = get(row, ["商品分類_中", "商品分類中", "分類_中", "分類中", "中分類"]);
    const categorySmall = get(row, ["商品分類_小", "商品分類小", "分類_小", "分類小", "小分類"]);
    const categoryDetail = get(row, ["商品分類_詳細", "商品分類詳細", "分類_詳細", "分類詳細", "詳細"]);
    const inventoryType = inferInventoryType(
      categoryLarge,
      categorySmall,
      categoryDetail,
      get(row, ["在庫タイプ", "在庫種別", "管理タイプ"]),
    );
    const displayName =
      get(row, ["表示商品名", "商品名", "権益特典", "権益名", "特典名"]) ||
      productDisplayName(categoryLarge, categoryMiddle, categorySmall, categoryDetail);

    if (!categoryLarge || (!displayName && !categorySmall && !categoryDetail)) {
      warnings.push(`${rowNumber}行目: 必須項目が不足しているためスキップしました。`);
      return;
    }

    const standardPrice = parseAmount(get(row, ["定価", "価格", "標準価格"]));
    const standardCost = parseAmount(get(row, ["原価", "標準原価"]));
    const standardSpec = get(row, ["標準仕様", "仕様", "細かい仕様"]);
    const candidate: Product = {
      id: `p-import-${Date.now()}-${index}`,
      displayName,
      categoryLarge,
      categoryMiddle,
      categorySmall,
      categoryDetail,
      inventoryType,
      standardPrice,
      standardCost,
      standardSpec,
    };
    const key = productKey(candidate);
    actionProductByKey.set(key, {
      displayName: candidate.displayName,
      categoryLarge: candidate.categoryLarge,
      categoryMiddle: candidate.categoryMiddle,
      categorySmall: candidate.categorySmall,
      categoryDetail: candidate.categoryDetail,
      inventoryType: candidate.inventoryType,
      standardPrice: candidate.standardPrice,
      standardCost: candidate.standardCost,
      standardSpec: candidate.standardSpec,
    });

    let product = products.find((item) => productKey(item) === key);

    if (!product) {
      product = candidate;
      products.push(product);
      importedProducts.push(product);
    }

    const siblingCount = slots.filter((slot) => slot.productId === product?.id).length + 1;
    const explicitSlotName = get(row, ["枠名", "販売枠名", "スロット名"]);
    const slotName =
      explicitSlotName ||
      `${displayName} ${inventoryType === "試合日枠" ? "日付" : "枠"}${siblingCount}`;
    const slot: Slot = {
      id: `s-import-${Date.now()}-${index}`,
      productId: product.id,
      slotName,
      slotNumber: get(row, ["枠番号", "枠No", "番号"]) || String(siblingCount),
      season: get(row, ["シーズン", "年度"]) || "2026-27",
      targetMatch: get(row, ["対象試合", "試合", "日付"]),
      location: get(row, ["場所", "会場", "掲出場所"]),
      status: "未販売",
      company: "",
      owner: "",
      listPrice: standardPrice,
      salesPrice: 0,
      cost: standardCost,
      productionDue: "",
      productionStatus: "未着手",
      specDetail: get(row, ["仕様詳細", "詳細仕様", "標準仕様", "仕様", "細かい仕様"]) || standardSpec,
      inspectionStatus: "未対応",
      evidenceUrls: "",
      inspectionNote: "",
      inspectedAt: "",
    };
    slots.push(slot);
    importedSlots.push(slot);
    actionSlots.push({
      productKey: key,
      slotName: slot.slotName,
      slotNumber: slot.slotNumber,
      season: slot.season,
      targetMatch: slot.targetMatch,
      location: slot.location,
      listPrice: slot.listPrice,
      cost: slot.cost,
      specDetail: slot.specDetail,
    });
  });

  return {
    products: importedProducts,
    slots: importedSlots,
    actionProducts: Array.from(actionProductByKey.values()),
    actionSlots,
    warnings,
  };
}

const sampleCsv = `商品分類_大	商品分類_中	商品分類_小	商品分類_詳細	表示商品名	在庫タイプ	定価	原価	対象試合	場所	標準仕様
露出	会場	フラッグ	フラッグ	パートナーフラッグ	シーズン枠	800000	120000	ホームゲーム	会場内	W900 x H1800
露出	会場	フラッグ	フラッグ	パートナーフラッグ	シーズン枠	800000	120000	ホームゲーム	会場内	W900 x H1800
アクティベーション	会場	サンプリング	日付	サンプリング	試合日枠	200000	30000	10/10 vs 愛媛 @ 照葉	コンコース	配布数量は別途調整`;

export default function SponsorshipApp({
  initialProducts,
  initialSlots,
  initialCompanies,
  initialProposals,
  initialContracts,
  initialContractItems,
  initialReviewStates,
  currentUser,
}: {
  initialProducts: Product[];
  initialSlots: Slot[];
  initialCompanies: Company[];
  initialProposals: Proposal[];
  initialContracts: Contract[];
  initialContractItems: ContractItem[];
  initialReviewStates: Record<string, ReviewState>;
  currentUser?: CurrentUser;
}) {
  const fallbackProducts = initialProducts.length ? initialProducts : seedProducts;
  const fallbackSlots = initialSlots.length ? initialSlots : seedSlots;
  const [activeView, setActiveView] = useState<
    "slots" | "products" | "companies" | "contracts" | "calendar" | "review" | "csv" | "report"
  >("slots");
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [slots, setSlots] = useState<Slot[]>(fallbackSlots);
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const [contractItems, setContractItems] = useState<ContractItem[]>(initialContractItems);
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewState>>(initialReviewStates);
  const [reviewStatusFilter, setReviewStatusFilter] = useState<ReviewStatus | "すべて">("すべて");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SlotStatus | "すべて">("すべて");
  const [selectedSlotId, setSelectedSlotId] = useState(fallbackSlots[0]?.id || "");
  const [selectedProductId, setSelectedProductId] = useState(fallbackProducts[0]?.id || "");
  const [csvText, setCsvText] = useState(sampleCsv);
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const [lastImportSummary, setLastImportSummary] = useState("");
  const [panelMode, setPanelMode] = useState<"detail" | "create">("detail");
  const [createMessage, setCreateMessage] = useState("");
  const [companyMessage, setCompanyMessage] = useState("");
  const [companyForm, setCompanyForm] = useState<CompanyForm>({
    name: "",
    industry: "",
    owner: "営業A",
    status: "提案先",
    note: "",
  });
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposalForm, setProposalForm] = useState<ProposalForm>({
    companyName: initialCompanies[0]?.name || "",
    proposedDate: "",
    status: "提案中",
    proposedPrice: "",
    owner: "営業A",
    lostReason: "",
    note: "",
  });
  const [contractMessage, setContractMessage] = useState("");
  const [contractForm, setContractForm] = useState<ContractForm>({
    companyName: initialCompanies[0]?.name || "",
    name: "",
    season: "2026-27",
    startDate: "2026-07-01",
    endDate: "2027-06-30",
    totalAmount: "",
    status: "契約済み",
    billingStatus: "未請求",
    owner: "営業A",
    note: "",
    selectedSlotIds: [],
  });
  const [createForm, setCreateForm] = useState<CreateForm>(() => ({
    productMode: "existing",
    productId: fallbackProducts[0]?.id || "",
    displayName: "",
    categoryLarge: "露出",
    categoryMiddle: "",
    categorySmall: "",
    categoryDetail: "",
    inventoryType: "シーズン枠",
    standardPrice: "",
    standardCost: "",
    standardSpec: "",
    slotName: "",
    slotNumber: "",
    season: "2026-27",
    targetMatch: "",
    location: "",
    status: "未販売",
    company: "",
    owner: "営業A",
    listPrice: "",
    salesPrice: "",
    cost: "",
    productionDue: "",
    productionStatus: "未着手",
    specDetail: "",
  }));
  const [isPending, startTransition] = useTransition();

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const filteredSlots = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return slots.filter((slot) => {
      const product = productById.get(slot.productId);
      const haystack = [
        slot.slotName,
        slot.company,
        slot.owner,
        slot.targetMatch,
        slot.location,
        product?.displayName,
        product?.categoryLarge,
        product?.categoryMiddle,
        product?.categorySmall,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (!normalized || haystack.includes(normalized)) && (statusFilter === "すべて" || slot.status === statusFilter);
    });
  }, [productById, query, slots, statusFilter]);

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) || slots[0];
  const selectedProduct = selectedSlot ? productById.get(selectedSlot.productId) : undefined;
  const selectedProposals = selectedSlot ? proposals.filter((proposal) => proposal.slotId === selectedSlot.id) : [];

  const productSummaries = useMemo(() => {
    return products.map((product) => {
      const productSlots = slots.filter((slot) => slot.productId === product.id);
      const salesForecast = productSlots.reduce((sum, slot) => sum + (slot.salesPrice || slot.listPrice || 0), 0);
      const grossForecast = productSlots.reduce((sum, slot) => sum + ((slot.salesPrice || slot.listPrice || 0) - slot.cost), 0);
      return {
        product,
        total: productSlots.length,
        unsold: productSlots.filter((slot) => slot.status === "未販売").length,
        proposed: productSlots.filter((slot) => slot.status === "提案中").length,
        held: productSlots.filter((slot) => slot.status === "仮押さえ").length,
        contracted: productSlots.filter((slot) => slot.status === "契約済み").length,
        salesForecast,
        grossForecast,
      };
    });
  }, [products, slots]);

  const selectedProductSummary = useMemo(() => {
    const product = products.find((item) => item.id === selectedProductId) || products[0];
    if (!product) return null;
    const productSlots = slots.filter((slot) => slot.productId === product.id);
    const revenue = productSlots.reduce((sum, slot) => sum + (slot.salesPrice || slot.listPrice), 0);
    const cost = productSlots.reduce((sum, slot) => sum + slot.cost, 0);
    return {
      product,
      slots: productSlots,
      total: productSlots.length,
      open: productSlots.filter((slot) => slot.status === "未販売").length,
      proposed: productSlots.filter((slot) => slot.status === "提案中").length,
      held: productSlots.filter((slot) => slot.status === "仮押さえ").length,
      contracted: productSlots.filter((slot) => slot.status === "契約済み").length,
      inspectionOpen: productSlots.filter((slot) => slot.inspectionStatus !== "完了").length,
      revenue,
      cost,
      gross: revenue - cost,
    };
  }, [products, selectedProductId, slots]);

  const productQualityGroups = useMemo(() => {
    const groups = new Map<string, Product[]>();
    for (const product of products) {
      const key = looseProductKey(product);
      groups.set(key, [...(groups.get(key) || []), product]);
    }
    return Array.from(groups.values())
      .filter((group) => group.length > 1)
      .map((group) => ({
        key: looseProductKey(group[0]),
        products: group,
        slotCount: group.reduce((sum, product) => sum + slots.filter((slot) => slot.productId === product.id).length, 0),
      }))
      .sort((left, right) => right.slotCount - left.slotCount);
  }, [products, slots]);

  const companySummaries = useMemo(() => {
    return companies.map((company) => {
      const companySlots = slots.filter((slot) => slot.company === company.name);
      const companyProposals = proposals.filter((proposal) => proposal.companyName === company.name);
      return {
        company,
        proposed: companyProposals.filter((proposal) => proposal.status === "提案中").length,
        held: companyProposals.filter((proposal) => proposal.status === "仮押さえ").length,
        contracted: companyProposals.filter((proposal) => proposal.status === "受注").length + companySlots.filter((slot) => slot.status === "契約済み").length,
        totalAmount: companySlots.reduce((sum, slot) => sum + (slot.salesPrice || slot.listPrice), 0),
        gross: companySlots.reduce((sum, slot) => sum + (slot.salesPrice || slot.listPrice) - slot.cost, 0),
      };
    });
  }, [companies, proposals, slots]);

  const companyQualityGroups = useMemo(() => {
    const names = new Map<string, { name: string; source: Set<string>; slotCount: number; proposalCount: number }>();
    for (const company of companies) {
      const current = names.get(company.name) || { name: company.name, source: new Set<string>(), slotCount: 0, proposalCount: 0 };
      current.source.add("会社マスタ");
      names.set(company.name, current);
    }
    for (const slot of slots) {
      if (!slot.company) continue;
      const current = names.get(slot.company) || { name: slot.company, source: new Set<string>(), slotCount: 0, proposalCount: 0 };
      current.source.add("販売枠");
      current.slotCount += 1;
      names.set(slot.company, current);
    }
    for (const proposal of proposals) {
      if (!proposal.companyName) continue;
      const current = names.get(proposal.companyName) || { name: proposal.companyName, source: new Set<string>(), slotCount: 0, proposalCount: 0 };
      current.source.add("提案履歴");
      current.proposalCount += 1;
      names.set(proposal.companyName, current);
    }

    const groups = new Map<string, Array<{ name: string; source: string[]; slotCount: number; proposalCount: number }>>();
    for (const item of names.values()) {
      const key = looseCompanyKey(item.name);
      if (!key) continue;
      groups.set(key, [
        ...(groups.get(key) || []),
        {
          name: item.name,
          source: Array.from(item.source),
          slotCount: item.slotCount,
          proposalCount: item.proposalCount,
        },
      ]);
    }

    return Array.from(groups.entries())
      .filter(([, group]) => group.length > 1)
      .map(([key, group]) => ({
        key,
        companies: group,
        slotCount: group.reduce((sum, item) => sum + item.slotCount, 0),
        proposalCount: group.reduce((sum, item) => sum + item.proposalCount, 0),
      }))
      .sort((left, right) => right.slotCount + right.proposalCount - (left.slotCount + left.proposalCount));
  }, [companies, proposals, slots]);

  const reviewSummary = useMemo(() => {
    const counts = reviewStatusOptions.reduce(
      (acc, status) => ({
        ...acc,
        [status]: 0,
      }),
      {} as Record<ReviewStatus, number>,
    );

    for (const group of productQualityGroups) {
      const status = reviewStates[`product:${group.key}`]?.status || "未確認";
      counts[status] += 1;
    }
    for (const group of companyQualityGroups) {
      const status = reviewStates[`company:${group.key}`]?.status || "未確認";
      counts[status] += 1;
    }

    return {
      counts,
      total: productQualityGroups.length + companyQualityGroups.length,
    };
  }, [companyQualityGroups, productQualityGroups, reviewStates]);

  const filteredProductQualityGroups = useMemo(() => {
    if (reviewStatusFilter === "すべて") return productQualityGroups;
    return productQualityGroups.filter((group) => (reviewStates[`product:${group.key}`]?.status || "未確認") === reviewStatusFilter);
  }, [productQualityGroups, reviewStates, reviewStatusFilter]);

  const filteredCompanyQualityGroups = useMemo(() => {
    if (reviewStatusFilter === "すべて") return companyQualityGroups;
    return companyQualityGroups.filter((group) => (reviewStates[`company:${group.key}`]?.status || "未確認") === reviewStatusFilter);
  }, [companyQualityGroups, reviewStates, reviewStatusFilter]);

  const contractSummaries = useMemo(() => {
    return contracts.map((contract) => {
      const items = contractItems.filter((item) => item.contractId === contract.id);
      const allocatedAmount = items.reduce((sum, item) => sum + item.allocatedAmount, 0);
      const cost = items.reduce((sum, item) => sum + item.cost, 0);
      return {
        contract,
        items,
        allocatedAmount,
        cost,
        gross: allocatedAmount - cost,
      };
    });
  }, [contractItems, contracts]);

  const availableContractSlots = useMemo(() => {
    return slots.filter((slot) => {
      const sameCompany = !slot.company || !contractForm.companyName || slot.company === contractForm.companyName;
      const alreadyInContract = contractItems.some((item) => item.slotId === slot.id);
      return sameCompany && (!alreadyInContract || contractForm.selectedSlotIds.includes(slot.id));
    });
  }, [contractForm.companyName, contractForm.selectedSlotIds, contractItems, slots]);

  const selectedContractSlots = useMemo(
    () => slots.filter((slot) => contractForm.selectedSlotIds.includes(slot.id)),
    [contractForm.selectedSlotIds, slots],
  );

  const csvPreview = useMemo(() => buildImportedRows(csvText, products, slots), [csvText, products, slots]);

  const calendarGroups = useMemo(() => {
    const dated = new Map<
      string,
      {
        dateKey: string;
        dateLabel: string;
        monthLabel: string;
        slots: Slot[];
      }
    >();
    const undated: Slot[] = [];

    for (const slot of slots) {
      const date = parseSlotDate(slot);
      if (!date) {
        undated.push(slot);
        continue;
      }
      const current = dated.get(date.dateKey) || {
        dateKey: date.dateKey,
        dateLabel: date.dateLabel,
        monthLabel: date.monthLabel,
        slots: [],
      };
      current.slots.push(slot);
      dated.set(date.dateKey, current);
    }

    return {
      dated: Array.from(dated.values()).sort((left, right) => left.dateKey.localeCompare(right.dateKey)),
      undated,
    };
  }, [slots]);

  const totals = useMemo(() => {
    const contractLike = slots.filter((slot) => ["仮押さえ", "契約済み", "制作中", "実施済み", "請求済み", "完了"].includes(slot.status));
    return {
      totalSlots: slots.length,
      openSlots: slots.filter((slot) => slot.status === "未販売").length,
      proposed: slots.filter((slot) => slot.status === "提案中").length,
      contracted: slots.filter((slot) => slot.status === "契約済み").length,
      revenue: contractLike.reduce((sum, slot) => sum + slot.salesPrice, 0),
      gross: contractLike.reduce((sum, slot) => sum + slot.salesPrice - slot.cost, 0),
    };
  }, [slots]);

  function updateSlot(slotId: string, patch: Partial<Slot>) {
    setSlots((current) => current.map((slot) => (slot.id === slotId ? { ...slot, ...patch } : slot)));
    startTransition(async () => {
      await updateInventorySlot(slotId, {
        status: patch.status,
        company: patch.company,
        salesPrice: patch.salesPrice,
        productionStatus: patch.productionStatus,
        inspectionStatus: patch.inspectionStatus,
        evidenceUrls: patch.evidenceUrls,
        inspectionNote: patch.inspectionNote,
        inspectedAt: patch.inspectedAt,
      });
    });
  }

  function updateReviewState(key: string, reviewType: "product" | "company", patch: Partial<ReviewState>) {
    const previous = reviewStates[key] || { status: "未確認", note: "" };
    const next = {
      status: patch.status ?? previous.status,
      note: patch.note ?? previous.note,
    };
    setReviewStates((current) => ({
      ...current,
      [key]: next,
    }));
    const input: UpsertReviewStateInput = {
      reviewKey: key,
      reviewType,
      status: next.status,
      note: next.note,
    };
    startTransition(async () => {
      await upsertReviewState(input);
    });
  }

  function updateCreateForm(patch: Partial<CreateForm>) {
    setCreateForm((current) => {
      const next = { ...current, ...patch };
      if (patch.productId && next.productMode === "existing") {
        const product = products.find((item) => item.id === patch.productId);
        if (product) {
          next.listPrice = String(product.standardPrice || "");
          next.cost = String(product.standardCost || "");
          next.specDetail = product.standardSpec;
          next.slotName = next.slotName || `${product.displayName} 枠${slots.filter((slot) => slot.productId === product.id).length + 1}`;
        }
      }
      return next;
    });
  }

  function submitCreateForm() {
    const selectedExistingProduct = products.find((product) => product.id === createForm.productId);
    const productForSlot =
      createForm.productMode === "existing"
        ? selectedExistingProduct
        : {
            id: "",
            displayName: createForm.displayName,
            categoryLarge: createForm.categoryLarge,
            categoryMiddle: createForm.categoryMiddle,
            categorySmall: createForm.categorySmall,
            categoryDetail: createForm.categoryDetail,
            inventoryType: createForm.inventoryType,
            standardPrice: Number(createForm.standardPrice) || 0,
            standardCost: Number(createForm.standardCost) || 0,
            standardSpec: createForm.standardSpec,
          };

    if (!productForSlot) {
      setCreateMessage("商品を選択してください。");
      return;
    }

    const slotName = createForm.slotName || `${productForSlot.displayName} 枠`;
    const input: CreateSlotInput = {
      productMode: createForm.productMode,
      productId: createForm.productMode === "existing" ? createForm.productId : undefined,
      displayName: productForSlot.displayName,
      categoryLarge: productForSlot.categoryLarge,
      categoryMiddle: productForSlot.categoryMiddle,
      categorySmall: productForSlot.categorySmall,
      categoryDetail: productForSlot.categoryDetail,
      inventoryType: productForSlot.inventoryType,
      standardPrice: Number(createForm.standardPrice || productForSlot.standardPrice) || 0,
      standardCost: Number(createForm.standardCost || productForSlot.standardCost) || 0,
      standardSpec: createForm.standardSpec || productForSlot.standardSpec,
      slotName,
      slotNumber: createForm.slotNumber,
      season: createForm.season,
      targetMatch: createForm.targetMatch,
      location: createForm.location,
      status: createForm.status,
      company: createForm.company,
      owner: createForm.owner,
      listPrice: Number(createForm.listPrice || productForSlot.standardPrice) || 0,
      salesPrice: Number(createForm.salesPrice) || 0,
      cost: Number(createForm.cost || productForSlot.standardCost) || 0,
      productionDue: createForm.productionDue,
      productionStatus: createForm.productionStatus,
      specDetail: createForm.specDetail || productForSlot.standardSpec,
    };

    setCreateMessage("作成中です。");
    startTransition(async () => {
      const created = await createSlot(input);
      if (created.product) {
        const product: Product = {
          id: created.product.id,
          displayName: created.product.displayName,
          categoryLarge: created.product.categoryLarge,
          categoryMiddle: created.product.categoryMiddle,
          categorySmall: created.product.categorySmall,
          categoryDetail: created.product.categoryDetail,
          inventoryType: created.product.inventoryType as InventoryType,
          standardPrice: created.product.standardPrice,
          standardCost: created.product.standardCost,
          standardSpec: created.product.standardSpec,
        };
        setProducts((current) => [...current, product]);
      }
      const slot: Slot = {
        id: created.slot.id,
        productId: created.slot.productId,
        slotName: created.slot.slotName,
        slotNumber: created.slot.slotNumber,
        season: created.slot.season,
        targetMatch: created.slot.targetMatch,
        location: created.slot.location,
        status: created.slot.status as SlotStatus,
        company: created.slot.company,
        owner: created.slot.owner,
        listPrice: created.slot.listPrice,
        salesPrice: created.slot.salesPrice,
        cost: created.slot.cost,
        productionDue: created.slot.productionDue,
        productionStatus: created.slot.productionStatus as ProductionStatus,
        specDetail: created.slot.specDetail,
        inspectionStatus: created.slot.inspectionStatus as InspectionStatus,
        evidenceUrls: created.slot.evidenceUrls,
        inspectionNote: created.slot.inspectionNote,
        inspectedAt: created.slot.inspectedAt,
      };
      setSlots((current) => [...current, slot]);
      setSelectedSlotId(slot.id);
      setPanelMode("detail");
      setCreateMessage("販売枠を作成しました。");
      setCreateForm((current) => ({
        ...current,
        slotName: "",
        slotNumber: "",
        targetMatch: "",
        location: "",
        company: "",
        listPrice: "",
        salesPrice: "",
        cost: "",
        productionDue: "",
        specDetail: "",
      }));
    });
  }

  function submitCompanyForm() {
    if (!companyForm.name.trim()) {
      setCompanyMessage("会社名を入力してください。");
      return;
    }

    const input: CreateCompanyInput = {
      name: companyForm.name.trim(),
      industry: companyForm.industry.trim(),
      owner: companyForm.owner.trim(),
      status: companyForm.status.trim() || "提案先",
      note: companyForm.note.trim(),
    };

    setCompanyMessage("作成中です。");
    startTransition(async () => {
      const created = await createCompany(input);
      setCompanies((current) => {
        if (current.some((company) => company.id === created.id || company.name === created.name)) {
          return current;
        }
        return [...current, created as Company];
      });
      setCompanyForm({
        name: "",
        industry: "",
        owner: input.owner,
        status: "提案先",
        note: "",
      });
      setCompanyMessage("会社を作成しました。");
    });
  }

  function submitProposalForm(slot: Slot) {
    if (!proposalForm.companyName.trim()) {
      setProposalMessage("会社を選択してください。");
      return;
    }

    const input: CreateProposalInput = {
      slotId: slot.id,
      companyName: proposalForm.companyName,
      proposedDate: proposalForm.proposedDate,
      status: proposalForm.status,
      proposedPrice: Number(proposalForm.proposedPrice || slot.salesPrice || slot.listPrice) || 0,
      owner: proposalForm.owner,
      lostReason: proposalForm.lostReason,
      note: proposalForm.note,
    };

    setProposalMessage("追加中です。");
    startTransition(async () => {
      const created = await createProposal(input);
      setProposals((current) => [...current, created as Proposal]);
      if (input.status === "仮押さえ" || input.status === "受注") {
        const nextStatus: SlotStatus = input.status === "受注" ? "契約済み" : "仮押さえ";
        updateSlot(slot.id, {
          status: nextStatus,
          company: input.companyName,
          salesPrice: input.proposedPrice,
        });
      }
      setProposalMessage("提案履歴を追加しました。");
      setProposalForm((current) => ({
        ...current,
        proposedDate: "",
        status: "提案中",
        proposedPrice: "",
        lostReason: "",
        note: "",
      }));
    });
  }

  function submitContractForm() {
    if (!contractForm.companyName.trim()) {
      setContractMessage("会社を選択してください。");
      return;
    }

    if (contractForm.selectedSlotIds.length === 0) {
      setContractMessage("契約に含める販売枠を選択してください。");
      return;
    }

    const items = selectedContractSlots.map((slot) => ({
      slotId: slot.id,
      itemName: slot.slotName,
      allocatedAmount: slot.salesPrice || slot.listPrice || 0,
      cost: slot.cost,
      note: "",
    }));
    const allocatedTotal = items.reduce((sum, item) => sum + item.allocatedAmount, 0);
    const totalAmount = Number(contractForm.totalAmount || allocatedTotal) || 0;
    const input: CreateContractInput = {
      companyName: contractForm.companyName,
      name: contractForm.name.trim() || `${contractForm.companyName} ${contractForm.season}契約`,
      season: contractForm.season,
      startDate: contractForm.startDate,
      endDate: contractForm.endDate,
      totalAmount,
      status: contractForm.status,
      billingStatus: contractForm.billingStatus,
      owner: contractForm.owner,
      note: contractForm.note,
      items,
    };

    setContractMessage("契約を作成中です。");
    startTransition(async () => {
      const created = await createContract(input);
      setContracts((current) => [created.contract as Contract, ...current]);
      setContractItems((current) => [...created.items as ContractItem[], ...current]);
      setSlots((current) =>
        current.map((slot) => {
          const item = items.find((candidate) => candidate.slotId === slot.id);
          if (!item) return slot;
          return {
            ...slot,
            status: "契約済み",
            company: input.companyName,
            salesPrice: item.allocatedAmount || slot.salesPrice,
          };
        }),
      );
      setContractForm((current) => ({
        ...current,
        name: "",
        totalAmount: "",
        note: "",
        selectedSlotIds: [],
      }));
      setContractMessage("契約を作成しました。");
    });
  }

  function importCsv() {
    const result = csvPreview;
    if (result.slots.length === 0) {
      setCsvWarnings(result.warnings.length ? result.warnings : ["取り込める販売枠がありません。"]);
      setLastImportSummary("");
      return;
    }
    setProducts((current) => [...current, ...result.products]);
    setSlots((current) => [...current, ...result.slots]);
    setCsvWarnings(result.warnings);
    setLastImportSummary(`商品 ${result.products.length}件、販売枠 ${result.slots.length}件を追加中です。`);
    setActiveView("slots");
    startTransition(async () => {
      const summary = await importProductsAndSlots(result.actionProducts, result.actionSlots);
      setLastImportSummary(`商品 ${summary.createdProducts}件、販売枠 ${summary.createdSlots}件をDBへ追加しました。`);
    });
  }

  return (
    <main className="min-h-screen bg-[#f6f7f8] text-[#172026]">
      <div className="grid min-h-screen grid-cols-[240px_1fr]">
        <aside className="border-r border-[#d9dee3] bg-white">
          <div className="border-b border-[#d9dee3] px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#607080]">Sponsorship</p>
            <h1 className="mt-2 text-lg font-semibold leading-6">商品管理プロトタイプ</h1>
          </div>
          <nav className="space-y-1 px-3 py-4 text-sm">
            {[
              ["slots", "販売枠"],
              ["products", "商品マスタ"],
              ["companies", "会社"],
              ["contracts", "契約"],
              ["calendar", "カレンダー"],
              ["review", "品質レビュー"],
              ["csv", "CSVインポート"],
              ["report", "売上・粗利"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveView(key as typeof activeView)}
                className={`w-full rounded-md px-3 py-2 text-left font-medium transition ${
                  activeView === key ? "bg-[#172026] text-white" : "text-[#405060] hover:bg-[#edf0f2]"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="mx-3 mt-4 border-t border-[#d9dee3] pt-4 text-xs text-[#607080]">
            <p>初期版: ログインなし</p>
            <p className="mt-1">対象: MVP 1</p>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex items-center justify-between border-b border-[#d9dee3] bg-white px-6 py-4">
            <div>
              <p className="text-xs font-medium text-[#607080]">2026-27 season</p>
              <h2 className="text-xl font-semibold">
                {activeView === "slots" && "販売枠一覧"}
                {activeView === "products" && "商品マスタ一覧"}
                {activeView === "companies" && "会社一覧"}
                {activeView === "contracts" && "契約一覧"}
                {activeView === "calendar" && "試合日カレンダー"}
                {activeView === "review" && "統合候補レビュー"}
                {activeView === "csv" && "CSVインポート"}
                {activeView === "report" && "売上・粗利レポート"}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isPending && <span className="text-xs font-medium text-[#607080]">保存中...</span>}
              {currentUser ? (
                <>
                  <div className="rounded-md border border-[#ccd3da] bg-white px-3 py-2 text-xs">
                    <span className="font-semibold">{currentUser.name}</span>
                    <span className="ml-2 text-[#607080]">{roleLabel(currentUser.role)}</span>
                  </div>
                  <a
                    href="/auth/sign-out"
                    className="inline-flex h-9 items-center rounded-md border border-[#ccd3da] bg-white px-3 text-sm font-medium hover:bg-[#f1f3f5]"
                  >
                    ログアウト
                  </a>
                </>
              ) : (
                <select className="h-9 rounded-md border border-[#ccd3da] bg-white px-3 text-sm">
                  <option>営業A</option>
                  <option>営業マネージャー</option>
                  <option>運営担当</option>
                </select>
              )}
              <button
                onClick={() => {
                  setPanelMode("create");
                  setActiveView("slots");
                }}
                className="h-9 rounded-md border border-[#ccd3da] bg-white px-3 text-sm font-medium hover:bg-[#f1f3f5]"
              >
                新規作成
              </button>
            </div>
          </header>

          <div className="p-6">
            <section className="mb-5 grid grid-cols-5 gap-3">
              <Metric label="総枠数" value={`${totals.totalSlots}`} />
              <Metric label="空き枠" value={`${totals.openSlots}`} />
              <Metric label="提案中" value={`${totals.proposed}`} />
              <Metric label="契約済み" value={`${totals.contracted}`} />
              <Metric label="契約見込粗利" value={currency(totals.gross)} />
            </section>

            {activeView === "slots" && (
              <div className="grid grid-cols-[1fr_360px] gap-5">
                <section className="min-w-0 rounded-md border border-[#d9dee3] bg-white">
                  <div className="flex flex-wrap items-center gap-3 border-b border-[#d9dee3] px-4 py-3">
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="商品名、会社、試合、場所で検索"
                      className="h-9 min-w-[280px] flex-1 rounded-md border border-[#ccd3da] px-3 text-sm outline-none focus:border-[#172026]"
                    />
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as SlotStatus | "すべて")}
                      className="h-9 rounded-md border border-[#ccd3da] bg-white px-3 text-sm"
                    >
                      <option>すべて</option>
                      {statusOptions.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full min-w-[980px] border-collapse text-sm">
                      <thead className="bg-[#f1f3f5] text-left text-xs font-semibold text-[#607080]">
                        <tr>
                          <th className="px-4 py-3">販売枠</th>
                          <th className="px-3 py-3">商品分類</th>
                          <th className="px-3 py-3">対象試合</th>
                          <th className="px-3 py-3">ステータス</th>
                          <th className="px-3 py-3">会社</th>
                          <th className="px-3 py-3">販売価格</th>
                          <th className="px-3 py-3">粗利率</th>
                          <th className="px-3 py-3">制作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSlots.map((slot) => {
                          const product = productById.get(slot.productId);
                          return (
                            <tr
                              key={slot.id}
                              onClick={() => {
                                setSelectedSlotId(slot.id);
                                setPanelMode("detail");
                              }}
                              className={`cursor-pointer border-t border-[#edf0f2] hover:bg-[#f8fafb] ${
                                selectedSlotId === slot.id ? "bg-[#edf7f4]" : ""
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium">{slot.slotName}</div>
                                <div className="mt-1 text-xs text-[#607080]">{product?.displayName}</div>
                              </td>
                              <td className="px-3 py-3 text-xs text-[#405060]">
                                {product?.categoryLarge} / {product?.categoryMiddle} / {product?.categorySmall}
                              </td>
                              <td className="px-3 py-3 text-[#405060]">{slot.targetMatch || "-"}</td>
                              <td className="px-3 py-3">
                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClass(slot.status)}`}>
                                  {slot.status}
                                </span>
                              </td>
                              <td className="px-3 py-3">{slot.company || "-"}</td>
                              <td className="px-3 py-3 font-medium">{currency(slot.salesPrice || slot.listPrice)}</td>
                              <td className="px-3 py-3">{marginRate(slot.salesPrice || slot.listPrice, slot.cost)}</td>
                              <td className="px-3 py-3 text-[#405060]">{slot.productionStatus}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {panelMode === "create" && (
                  <CreateSlotPanel
                    form={createForm}
                    products={products}
                    companies={companies}
                    isPending={isPending}
                    message={createMessage}
                    onChange={updateCreateForm}
                    onCancel={() => setPanelMode("detail")}
                    onSubmit={submitCreateForm}
                  />
                )}

                {panelMode === "detail" && selectedSlot && (
                  <aside className="rounded-md border border-[#d9dee3] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-[#607080]">販売枠詳細</p>
                        <h3 className="mt-1 text-lg font-semibold leading-6">{selectedSlot.slotName}</h3>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClass(selectedSlot.status)}`}>
                        {selectedSlot.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <Field label="商品" value={selectedProduct?.displayName || "-"} />
                      <Field label="対象試合" value={selectedSlot.targetMatch || "-"} />
                      <Field label="場所" value={selectedSlot.location || "-"} />
                      <Field label="仕様" value={selectedSlot.specDetail || "-"} />
                      <Field label="検収" value={`${selectedSlot.inspectionStatus} ${selectedSlot.inspectedAt ? `/ ${selectedSlot.inspectedAt}` : ""}`} />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Field label="販売価格" value={currency(selectedSlot.salesPrice || selectedSlot.listPrice)} />
                      <Field label="原価" value={currency(selectedSlot.cost)} />
                      <Field label="粗利" value={currency((selectedSlot.salesPrice || selectedSlot.listPrice) - selectedSlot.cost)} />
                      <Field label="粗利率" value={marginRate(selectedSlot.salesPrice || selectedSlot.listPrice, selectedSlot.cost)} />
                    </div>

                    <div className="mt-5 space-y-3">
                      <label className="block text-xs font-semibold text-[#607080]">
                        ステータス
                        <select
                          value={selectedSlot.status}
                          onChange={(event) => updateSlot(selectedSlot.id, { status: event.target.value as SlotStatus })}
                          className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
                        >
                          {statusOptions.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-xs font-semibold text-[#607080]">
                        会社
                        <select
                          value={selectedSlot.company}
                          onChange={(event) => updateSlot(selectedSlot.id, { company: event.target.value })}
                          className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
                        >
                          <option value="">未設定</option>
                          {companies.map((company) => (
                            <option key={company.id} value={company.name}>
                              {company.name}
                            </option>
                          ))}
                          {selectedSlot.company && !companies.some((company) => company.name === selectedSlot.company) && (
                            <option value={selectedSlot.company}>{selectedSlot.company}</option>
                          )}
                        </select>
                      </label>
                      <label className="block text-xs font-semibold text-[#607080]">
                        販売価格
                        <input
                          value={selectedSlot.salesPrice}
                          onChange={(event) => updateSlot(selectedSlot.id, { salesPrice: Number(event.target.value) || 0 })}
                          className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] px-3 text-sm text-[#172026]"
                          type="number"
                        />
                      </label>
                      <label className="block text-xs font-semibold text-[#607080]">
                        制作ステータス
                        <select
                          value={selectedSlot.productionStatus}
                          onChange={(event) => updateSlot(selectedSlot.id, { productionStatus: event.target.value as ProductionStatus })}
                          className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
                        >
                          {productionOptions.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-6 border-t border-[#d9dee3] pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">検収URL管理</h4>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${inspectionClass(selectedSlot.inspectionStatus)}`}>
                          {selectedSlot.inspectionStatus}
                        </span>
                      </div>
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <label className="block text-xs font-semibold text-[#607080]">
                            検収ステータス
                            <select
                              value={selectedSlot.inspectionStatus}
                              onChange={(event) => updateSlot(selectedSlot.id, { inspectionStatus: event.target.value as InspectionStatus })}
                              className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
                            >
                              {inspectionOptions.map((status) => (
                                <option key={status}>{status}</option>
                              ))}
                            </select>
                          </label>
                          <TextInput
                            label="最終確認日"
                            value={selectedSlot.inspectedAt}
                            onChange={(value) => updateSlot(selectedSlot.id, { inspectedAt: value })}
                            type="date"
                          />
                        </div>
                        <label className="block text-xs font-semibold text-[#607080]">
                          証跡URL
                          <textarea
                            value={selectedSlot.evidenceUrls}
                            onChange={(event) => updateSlot(selectedSlot.id, { evidenceUrls: event.target.value })}
                            placeholder="写真、動画、共有フォルダ、投稿URLなどを1行ずつ"
                            className="mt-1 h-24 w-full resize-none rounded-md border border-[#ccd3da] px-3 py-2 text-sm text-[#172026]"
                          />
                        </label>
                        {extractUrls(selectedSlot.evidenceUrls).length > 0 && (
                          <div className="space-y-1 rounded-md bg-[#f6f7f8] p-3">
                            {extractUrls(selectedSlot.evidenceUrls).map((url) => (
                              <a
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="block truncate text-xs font-medium text-[#23594b] underline"
                              >
                                {url}
                              </a>
                            ))}
                          </div>
                        )}
                        <label className="block text-xs font-semibold text-[#607080]">
                          社内確認メモ
                          <textarea
                            value={selectedSlot.inspectionNote}
                            onChange={(event) => updateSlot(selectedSlot.id, { inspectionNote: event.target.value })}
                            className="mt-1 h-20 w-full resize-none rounded-md border border-[#ccd3da] px-3 py-2 text-sm text-[#172026]"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-[#d9dee3] pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">提案履歴</h4>
                        <span className="text-xs text-[#607080]">{selectedProposals.length}件</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {selectedProposals.length === 0 && <p className="text-sm text-[#607080]">まだ提案履歴がありません。</p>}
                        {selectedProposals.map((proposal) => (
                          <div key={proposal.id} className="rounded-md border border-[#edf0f2] p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold">{proposal.companyName}</p>
                                <p className="mt-1 text-xs text-[#607080]">
                                  {proposal.proposedDate || "日付未設定"} / {proposal.owner || "-"}
                                </p>
                              </div>
                              <span className="rounded-full bg-[#f1f3f5] px-2 py-1 text-xs font-semibold text-[#405060]">
                                {proposal.status}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-medium">{currency(proposal.proposedPrice)}</p>
                            {proposal.lostReason && <p className="mt-1 text-xs text-rose-700">失注理由: {proposal.lostReason}</p>}
                            {proposal.note && <p className="mt-1 text-xs text-[#607080]">{proposal.note}</p>}
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 rounded-md bg-[#f6f7f8] p-3">
                        <p className="text-xs font-semibold text-[#607080]">提案を追加</p>
                        <div className="mt-3 space-y-2">
                          <label className="block text-xs font-semibold text-[#607080]">
                            会社
                            <select
                              value={proposalForm.companyName}
                              onChange={(event) => setProposalForm((current) => ({ ...current, companyName: event.target.value }))}
                              className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
                            >
                              <option value="">選択してください</option>
                              {companies.map((company) => (
                                <option key={company.id} value={company.name}>
                                  {company.name}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <TextInput
                              label="提案日"
                              value={proposalForm.proposedDate}
                              onChange={(value) => setProposalForm((current) => ({ ...current, proposedDate: value }))}
                              type="date"
                            />
                            <label className="block text-xs font-semibold text-[#607080]">
                              結果
                              <select
                                value={proposalForm.status}
                                onChange={(event) =>
                                  setProposalForm((current) => ({ ...current, status: event.target.value as Proposal["status"] }))
                                }
                                className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
                              >
                                <option>提案中</option>
                                <option>仮押さえ</option>
                                <option>受注</option>
                                <option>失注</option>
                                <option>保留</option>
                              </select>
                            </label>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <TextInput
                              label="提案金額"
                              value={proposalForm.proposedPrice}
                              onChange={(value) => setProposalForm((current) => ({ ...current, proposedPrice: value }))}
                              type="number"
                            />
                            <TextInput
                              label="担当"
                              value={proposalForm.owner}
                              onChange={(value) => setProposalForm((current) => ({ ...current, owner: value }))}
                            />
                          </div>
                          {proposalForm.status === "失注" && (
                            <TextInput
                              label="失注理由"
                              value={proposalForm.lostReason}
                              onChange={(value) => setProposalForm((current) => ({ ...current, lostReason: value }))}
                            />
                          )}
                          <TextInput
                            label="メモ"
                            value={proposalForm.note}
                            onChange={(value) => setProposalForm((current) => ({ ...current, note: value }))}
                          />
                        </div>
                        {proposalMessage && <p className="mt-3 text-xs text-[#23594b]">{proposalMessage}</p>}
                        <button
                          onClick={() => submitProposalForm(selectedSlot)}
                          disabled={isPending}
                          className="mt-3 h-9 w-full rounded-md bg-[#172026] px-3 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {isPending ? "追加中" : "提案履歴を追加"}
                        </button>
                      </div>
                    </div>
                  </aside>
                )}
              </div>
            )}

            {activeView === "calendar" && (
              <section className="space-y-5">
                <div className="rounded-md border border-[#d9dee3] bg-white">
                  <div className="border-b border-[#d9dee3] px-4 py-3">
                    <h3 className="font-semibold">日付別 販売枠状況</h3>
                    <p className="mt-1 text-sm text-[#607080]">対象試合や販売枠名の日付をもとに、試合日ごとの枠・契約・検収を確認します。</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-2">
                    {calendarGroups.dated.length === 0 && (
                      <div className="rounded-md border border-[#edf0f2] p-4 text-sm text-[#607080]">
                        日付を読み取れる販売枠がありません。対象試合に `10/10` のような日付を入れると表示されます。
                      </div>
                    )}
                    {calendarGroups.dated.map((group) => {
                      const contracted = group.slots.filter((slot) => slot.status === "契約済み").length;
                      const open = group.slots.filter((slot) => slot.status === "未販売").length;
                      const inspectionOpen = group.slots.filter((slot) => slot.inspectionStatus !== "完了").length;
                      const revenue = group.slots.reduce((sum, slot) => sum + (slot.salesPrice || slot.listPrice), 0);
                      return (
                        <article key={group.dateKey} className="rounded-md border border-[#d9dee3]">
                          <div className="flex items-start justify-between gap-3 border-b border-[#edf0f2] px-4 py-3">
                            <div>
                              <p className="text-xs font-medium text-[#607080]">{group.monthLabel}</p>
                              <h4 className="mt-1 text-lg font-semibold">{group.dateLabel}</h4>
                            </div>
                            <div className="text-right text-xs text-[#607080]">
                              <p>{group.slots.length}枠</p>
                              <p className="mt-1 font-semibold text-[#172026]">{currency(revenue)}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2 px-4 py-3 text-center text-xs">
                            <div className="rounded-md bg-[#f6f7f8] p-2">
                              <p className="text-[#607080]">契約済み</p>
                              <p className="mt-1 font-semibold">{contracted}</p>
                            </div>
                            <div className="rounded-md bg-[#f6f7f8] p-2">
                              <p className="text-[#607080]">空き</p>
                              <p className="mt-1 font-semibold">{open}</p>
                            </div>
                            <div className="rounded-md bg-[#f6f7f8] p-2">
                              <p className="text-[#607080]">検収未完</p>
                              <p className="mt-1 font-semibold">{inspectionOpen}</p>
                            </div>
                            <div className="rounded-md bg-[#f6f7f8] p-2">
                              <p className="text-[#607080]">粗利</p>
                              <p className="mt-1 font-semibold">
                                {currency(group.slots.reduce((sum, slot) => sum + (slot.salesPrice || slot.listPrice) - slot.cost, 0))}
                              </p>
                            </div>
                          </div>
                          <div className="divide-y divide-[#edf0f2]">
                            {group.slots.map((slot) => {
                              const product = productById.get(slot.productId);
                              return (
                                <button
                                  key={slot.id}
                                  onClick={() => {
                                    setSelectedSlotId(slot.id);
                                    setPanelMode("detail");
                                    setActiveView("slots");
                                  }}
                                  className="block w-full px-4 py-3 text-left hover:bg-[#f8fafb]"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold">{slot.slotName}</p>
                                      <p className="mt-1 truncate text-xs text-[#607080]">
                                        {product?.categoryLarge || "-"} / {product?.categorySmall || "-"} / {slot.company || "未設定"}
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClass(slot.status)}`}>
                                        {slot.status}
                                      </span>
                                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${inspectionClass(slot.inspectionStatus)}`}>
                                        {slot.inspectionStatus}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                {calendarGroups.undated.length > 0 && (
                  <div className="rounded-md border border-[#d9dee3] bg-white">
                    <div className="border-b border-[#d9dee3] px-4 py-3">
                      <h3 className="font-semibold">日付未設定</h3>
                      <p className="mt-1 text-sm text-[#607080]">年間枠や日付が未確定の販売枠です。</p>
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full min-w-[780px] text-sm">
                        <thead className="bg-[#f1f3f5] text-left text-xs font-semibold text-[#607080]">
                          <tr>
                            <th className="px-4 py-3">販売枠</th>
                            <th className="px-3 py-3">対象</th>
                            <th className="px-3 py-3">会社</th>
                            <th className="px-3 py-3">ステータス</th>
                            <th className="px-3 py-3">検収</th>
                            <th className="px-3 py-3">金額</th>
                          </tr>
                        </thead>
                        <tbody>
                          {calendarGroups.undated.map((slot) => (
                            <tr
                              key={slot.id}
                              onClick={() => {
                                setSelectedSlotId(slot.id);
                                setPanelMode("detail");
                                setActiveView("slots");
                              }}
                              className="cursor-pointer border-t border-[#edf0f2] hover:bg-[#f8fafb]"
                            >
                              <td className="px-4 py-3 font-medium">{slot.slotName}</td>
                              <td className="px-3 py-3 text-[#405060]">{slot.targetMatch || "-"}</td>
                              <td className="px-3 py-3">{slot.company || "-"}</td>
                              <td className="px-3 py-3">
                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClass(slot.status)}`}>
                                  {slot.status}
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${inspectionClass(slot.inspectionStatus)}`}>
                                  {slot.inspectionStatus}
                                </span>
                              </td>
                              <td className="px-3 py-3 font-medium">{currency(slot.salesPrice || slot.listPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </section>
            )}

            {activeView === "products" && (
              <section className="grid grid-cols-[1fr_380px] gap-5">
                <div className="rounded-md border border-[#d9dee3] bg-white">
                  <div className="border-b border-[#d9dee3] px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">商品マスタ集計</h3>
                        <p className="mt-1 text-sm text-[#607080]">商品を選択すると、右側で販売枠と粗利の内訳を確認できます。</p>
                      </div>
                      <div className="rounded-md bg-[#f6f7f8] px-3 py-2 text-right">
                        <p className="text-xs text-[#607080]">表記ゆれ候補</p>
                        <p className="mt-1 text-lg font-semibold">{productQualityGroups.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead className="bg-[#f1f3f5] text-left text-xs font-semibold text-[#607080]">
                        <tr>
                          <th className="px-4 py-3">商品名</th>
                          <th className="px-3 py-3">分類</th>
                          <th className="px-3 py-3">在庫タイプ</th>
                          <th className="px-3 py-3">総枠</th>
                          <th className="px-3 py-3">空き</th>
                          <th className="px-3 py-3">提案中</th>
                          <th className="px-3 py-3">仮押さえ</th>
                          <th className="px-3 py-3">契約済み</th>
                          <th className="px-3 py-3">売上見込</th>
                          <th className="px-3 py-3">粗利見込</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productSummaries.map((summary) => (
                          <tr
                            key={summary.product.id}
                            onClick={() => setSelectedProductId(summary.product.id)}
                            className={`cursor-pointer border-t border-[#edf0f2] hover:bg-[#f8fafb] ${
                              selectedProductSummary?.product.id === summary.product.id ? "bg-[#edf7f4]" : ""
                            }`}
                          >
                            <td className="px-4 py-3 font-medium">{summary.product.displayName}</td>
                            <td className="px-3 py-3 text-xs text-[#405060]">
                              {summary.product.categoryLarge} / {summary.product.categoryMiddle} / {summary.product.categorySmall} /{" "}
                              {summary.product.categoryDetail}
                            </td>
                            <td className="px-3 py-3">{summary.product.inventoryType}</td>
                            <td className="px-3 py-3">{summary.total}</td>
                            <td className="px-3 py-3">{summary.unsold}</td>
                            <td className="px-3 py-3">{summary.proposed}</td>
                            <td className="px-3 py-3">{summary.held}</td>
                            <td className="px-3 py-3">{summary.contracted}</td>
                            <td className="px-3 py-3 font-medium">{currency(summary.salesForecast)}</td>
                            <td className="px-3 py-3 font-medium">{currency(summary.grossForecast)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedProductSummary && (
                  <aside className="rounded-md border border-[#d9dee3] bg-white p-4">
                    <div>
                      <p className="text-xs font-medium text-[#607080]">商品マスタ詳細</p>
                      <h3 className="mt-1 text-lg font-semibold leading-6">{selectedProductSummary.product.displayName}</h3>
                    </div>

                    <div className="mt-4 space-y-3">
                      <Field
                        label="分類"
                        value={`${selectedProductSummary.product.categoryLarge} / ${selectedProductSummary.product.categoryMiddle} / ${selectedProductSummary.product.categorySmall} / ${selectedProductSummary.product.categoryDetail}`}
                      />
                      <Field label="在庫タイプ" value={selectedProductSummary.product.inventoryType} />
                      <Field label="標準仕様" value={selectedProductSummary.product.standardSpec || "-"} />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Field label="標準価格" value={currency(selectedProductSummary.product.standardPrice)} />
                      <Field label="標準原価" value={currency(selectedProductSummary.product.standardCost)} />
                      <Field label="販売枠数" value={`${selectedProductSummary.total}`} />
                      <Field label="検収未完" value={`${selectedProductSummary.inspectionOpen}`} />
                      <Field label="売上見込" value={currency(selectedProductSummary.revenue)} />
                      <Field label="粗利見込" value={currency(selectedProductSummary.gross)} />
                    </div>

                    <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="rounded-md bg-[#f6f7f8] p-2">
                        <p className="text-[#607080]">空き</p>
                        <p className="mt-1 font-semibold">{selectedProductSummary.open}</p>
                      </div>
                      <div className="rounded-md bg-[#f6f7f8] p-2">
                        <p className="text-[#607080]">提案</p>
                        <p className="mt-1 font-semibold">{selectedProductSummary.proposed}</p>
                      </div>
                      <div className="rounded-md bg-[#f6f7f8] p-2">
                        <p className="text-[#607080]">仮押</p>
                        <p className="mt-1 font-semibold">{selectedProductSummary.held}</p>
                      </div>
                      <div className="rounded-md bg-[#f6f7f8] p-2">
                        <p className="text-[#607080]">契約</p>
                        <p className="mt-1 font-semibold">{selectedProductSummary.contracted}</p>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-[#d9dee3] pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">関連販売枠</h4>
                        <span className="text-xs text-[#607080]">{selectedProductSummary.slots.length}件</span>
                      </div>
                      <div className="mt-3 max-h-[360px] overflow-auto rounded-md border border-[#edf0f2]">
                        {selectedProductSummary.slots.length === 0 && <p className="p-3 text-sm text-[#607080]">販売枠がありません。</p>}
                        {selectedProductSummary.slots.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => {
                              setSelectedSlotId(slot.id);
                              setPanelMode("detail");
                              setActiveView("slots");
                            }}
                            className="block w-full border-t border-[#edf0f2] px-3 py-3 text-left first:border-t-0 hover:bg-[#f8fafb]"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{slot.slotName}</p>
                                <p className="mt-1 truncate text-xs text-[#607080]">
                                  {slot.targetMatch || "-"} / {slot.company || "未設定"}
                                </p>
                              </div>
                              <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ring-1 ${statusClass(slot.status)}`}>
                                {slot.status}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-[#607080]">
                              <span>{slot.inspectionStatus}</span>
                              <span className="font-semibold text-[#172026]">{currency(slot.salesPrice || slot.listPrice)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </aside>
                )}

                <aside className="col-start-2 rounded-md border border-[#d9dee3] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">表記ゆれチェック</h3>
                    <span className="text-xs text-[#607080]">{productQualityGroups.length}件</span>
                  </div>
                  <p className="mt-1 text-sm text-[#607080]">全角半角、空白、括弧、丸数字をならして近い商品を検出します。</p>
                  <div className="mt-3 max-h-64 overflow-auto rounded-md border border-[#edf0f2]">
                    {productQualityGroups.length === 0 && <p className="p-3 text-sm text-[#607080]">候補はありません。</p>}
                    {productQualityGroups.slice(0, 8).map((group) => (
                      <div key={group.key} className="border-t border-[#edf0f2] p-3 first:border-t-0">
                        <div className="flex items-center justify-between text-xs text-[#607080]">
                          <span>{group.products.length}商品</span>
                          <span>{group.slotCount}枠</span>
                        </div>
                        <div className="mt-2 space-y-1">
                          {group.products.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => setSelectedProductId(product.id)}
                              className="block w-full truncate rounded px-2 py-1 text-left text-sm font-medium hover:bg-[#f6f7f8]"
                            >
                              {product.displayName}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>
              </section>
            )}

            {activeView === "companies" && (
              <section className="grid grid-cols-[1fr_360px] gap-5">
                <div className="rounded-md border border-[#d9dee3] bg-white">
                  <div className="border-b border-[#d9dee3] px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">会社マスタ</h3>
                        <p className="mt-1 text-sm text-[#607080]">販売枠に入っている会社をマスタ化し、会社別の状況を確認します。</p>
                      </div>
                      <div className="rounded-md bg-[#f6f7f8] px-3 py-2 text-right">
                        <p className="text-xs text-[#607080]">表記ゆれ候補</p>
                        <p className="mt-1 text-lg font-semibold">{companyQualityGroups.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full min-w-[820px] text-sm">
                      <thead className="bg-[#f1f3f5] text-left text-xs font-semibold text-[#607080]">
                        <tr>
                          <th className="px-4 py-3">会社名</th>
                          <th className="px-3 py-3">業種</th>
                          <th className="px-3 py-3">担当</th>
                          <th className="px-3 py-3">ステータス</th>
                          <th className="px-3 py-3">提案中</th>
                          <th className="px-3 py-3">仮押さえ</th>
                          <th className="px-3 py-3">契約済み</th>
                          <th className="px-3 py-3">金額</th>
                          <th className="px-3 py-3">粗利</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companySummaries.map((summary) => (
                          <tr key={summary.company.id} className="border-t border-[#edf0f2]">
                            <td className="px-4 py-3 font-medium">{summary.company.name}</td>
                            <td className="px-3 py-3">{summary.company.industry || "-"}</td>
                            <td className="px-3 py-3">{summary.company.owner || "-"}</td>
                            <td className="px-3 py-3">{summary.company.status}</td>
                            <td className="px-3 py-3">{summary.proposed}</td>
                            <td className="px-3 py-3">{summary.held}</td>
                            <td className="px-3 py-3">{summary.contracted}</td>
                            <td className="px-3 py-3 font-medium">{currency(summary.totalAmount)}</td>
                            <td className="px-3 py-3 font-medium">{currency(summary.gross)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <aside className="rounded-md border border-[#d9dee3] bg-white p-4">
                  <div>
                    <p className="text-xs font-medium text-[#607080]">新規作成</p>
                    <h3 className="mt-1 text-lg font-semibold leading-6">会社を追加</h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    <TextInput
                      label="会社名"
                      value={companyForm.name}
                      onChange={(value) => setCompanyForm((current) => ({ ...current, name: value }))}
                    />
                    <TextInput
                      label="業種"
                      value={companyForm.industry}
                      onChange={(value) => setCompanyForm((current) => ({ ...current, industry: value }))}
                    />
                    <TextInput
                      label="担当"
                      value={companyForm.owner}
                      onChange={(value) => setCompanyForm((current) => ({ ...current, owner: value }))}
                    />
                    <label className="block text-xs font-semibold text-[#607080]">
                      ステータス
                      <select
                        value={companyForm.status}
                        onChange={(event) => setCompanyForm((current) => ({ ...current, status: event.target.value }))}
                        className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
                      >
                        <option>提案先</option>
                        <option>契約先</option>
                        <option>休眠</option>
                      </select>
                    </label>
                    <label className="block text-xs font-semibold text-[#607080]">
                      備考
                      <textarea
                        value={companyForm.note}
                        onChange={(event) => setCompanyForm((current) => ({ ...current, note: event.target.value }))}
                        className="mt-1 h-20 w-full resize-none rounded-md border border-[#ccd3da] px-3 py-2 text-sm text-[#172026]"
                      />
                    </label>
                  </div>
                  {companyMessage && <p className="mt-4 rounded-md bg-[#edf7f4] p-3 text-sm text-[#23594b]">{companyMessage}</p>}
                  <button
                    onClick={submitCompanyForm}
                    disabled={isPending}
                    className="mt-4 h-10 w-full rounded-md bg-[#172026] px-4 text-sm font-semibold text-white hover:bg-[#2b3741] disabled:opacity-60"
                  >
                    {isPending ? "保存中" : "会社を作成"}
                  </button>

                  <div className="mt-6 border-t border-[#d9dee3] pt-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">表記ゆれチェック</h3>
                      <span className="text-xs text-[#607080]">{companyQualityGroups.length}件</span>
                    </div>
                    <p className="mt-1 text-sm text-[#607080]">法人格、全角半角、空白、括弧をならして近い会社名を検出します。</p>
                    <div className="mt-3 max-h-72 overflow-auto rounded-md border border-[#edf0f2]">
                      {companyQualityGroups.length === 0 && <p className="p-3 text-sm text-[#607080]">候補はありません。</p>}
                      {companyQualityGroups.slice(0, 10).map((group) => (
                        <div key={group.key} className="border-t border-[#edf0f2] p-3 first:border-t-0">
                          <div className="flex items-center justify-between text-xs text-[#607080]">
                            <span>{group.companies.length}表記</span>
                            <span>
                              {group.slotCount}枠 / {group.proposalCount}提案
                            </span>
                          </div>
                          <div className="mt-2 space-y-2">
                            {group.companies.map((company) => (
                              <div key={company.name} className="rounded-md bg-[#f6f7f8] px-2 py-2">
                                <p className="truncate text-sm font-semibold">{company.name}</p>
                                <p className="mt-1 text-xs text-[#607080]">{company.source.join(" / ")}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </section>
            )}

            {activeView === "contracts" && (
              <section className="grid grid-cols-[1fr_400px] gap-5">
                <div className="rounded-md border border-[#d9dee3] bg-white">
                  <div className="border-b border-[#d9dee3] px-4 py-3">
                    <h3 className="font-semibold">契約一覧</h3>
                    <p className="mt-1 text-sm text-[#607080]">複数の販売枠をひとつの契約として束ね、請求入金と粗利を軽量に確認します。</p>
                  </div>
                  <div className="overflow-auto">
                    <table className="w-full min-w-[920px] text-sm">
                      <thead className="bg-[#f1f3f5] text-left text-xs font-semibold text-[#607080]">
                        <tr>
                          <th className="px-4 py-3">契約名</th>
                          <th className="px-3 py-3">会社</th>
                          <th className="px-3 py-3">期間</th>
                          <th className="px-3 py-3">明細</th>
                          <th className="px-3 py-3">契約額</th>
                          <th className="px-3 py-3">配分額</th>
                          <th className="px-3 py-3">粗利</th>
                          <th className="px-3 py-3">請求入金</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contractSummaries.length === 0 && (
                          <tr>
                            <td className="px-4 py-8 text-sm text-[#607080]" colSpan={8}>
                              まだ契約がありません。右側から作成できます。
                            </td>
                          </tr>
                        )}
                        {contractSummaries.map((summary) => (
                          <tr key={summary.contract.id} className="border-t border-[#edf0f2]">
                            <td className="px-4 py-3">
                              <div className="font-medium">{summary.contract.name}</div>
                              <div className="mt-1 text-xs text-[#607080]">
                                {summary.contract.season} / {summary.contract.owner || "-"} / {summary.contract.status}
                              </div>
                            </td>
                            <td className="px-3 py-3">{summary.contract.companyName}</td>
                            <td className="px-3 py-3 text-[#405060]">
                              {summary.contract.startDate || "-"} - {summary.contract.endDate || "-"}
                            </td>
                            <td className="px-3 py-3">{summary.items.length}</td>
                            <td className="px-3 py-3 font-medium">{currency(summary.contract.totalAmount)}</td>
                            <td className="px-3 py-3 font-medium">{currency(summary.allocatedAmount)}</td>
                            <td className="px-3 py-3 font-medium">{currency(summary.gross)}</td>
                            <td className="px-3 py-3">
                              <span className="rounded-full bg-[#f1f3f5] px-2 py-1 text-xs font-semibold text-[#405060]">
                                {summary.contract.billingStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <aside className="rounded-md border border-[#d9dee3] bg-white p-4">
                  <div>
                    <p className="text-xs font-medium text-[#607080]">新規作成</p>
                    <h3 className="mt-1 text-lg font-semibold leading-6">契約を追加</h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    <label className="block text-xs font-semibold text-[#607080]">
                      会社
                      <select
                        value={contractForm.companyName}
                        onChange={(event) =>
                          setContractForm((current) => ({
                            ...current,
                            companyName: event.target.value,
                            selectedSlotIds: [],
                          }))
                        }
                        className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
                      >
                        <option value="">選択してください</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.name}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <TextInput
                      label="契約名"
                      value={contractForm.name}
                      onChange={(value) => setContractForm((current) => ({ ...current, name: value }))}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <TextInput
                        label="シーズン"
                        value={contractForm.season}
                        onChange={(value) => setContractForm((current) => ({ ...current, season: value }))}
                      />
                      <TextInput
                        label="開始"
                        value={contractForm.startDate}
                        onChange={(value) => setContractForm((current) => ({ ...current, startDate: value }))}
                        type="date"
                      />
                      <TextInput
                        label="終了"
                        value={contractForm.endDate}
                        onChange={(value) => setContractForm((current) => ({ ...current, endDate: value }))}
                        type="date"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <TextInput
                        label="契約総額"
                        value={contractForm.totalAmount}
                        onChange={(value) => setContractForm((current) => ({ ...current, totalAmount: value }))}
                        type="number"
                      />
                      <TextInput
                        label="担当"
                        value={contractForm.owner}
                        onChange={(value) => setContractForm((current) => ({ ...current, owner: value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block text-xs font-semibold text-[#607080]">
                        契約状態
                        <select
                          value={contractForm.status}
                          onChange={(event) =>
                            setContractForm((current) => ({ ...current, status: event.target.value as Contract["status"] }))
                          }
                          className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
                        >
                          <option>契約済み</option>
                          <option>契約準備</option>
                          <option>終了</option>
                        </select>
                      </label>
                      <label className="block text-xs font-semibold text-[#607080]">
                        請求入金
                        <select
                          value={contractForm.billingStatus}
                          onChange={(event) =>
                            setContractForm((current) => ({
                              ...current,
                              billingStatus: event.target.value as Contract["billingStatus"],
                            }))
                          }
                          className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
                        >
                          <option>未請求</option>
                          <option>請求済み</option>
                          <option>入金済み</option>
                        </select>
                      </label>
                    </div>
                    <label className="block text-xs font-semibold text-[#607080]">
                      販売枠
                      <div className="mt-1 max-h-56 space-y-2 overflow-auto rounded-md border border-[#ccd3da] bg-white p-2">
                        {availableContractSlots.length === 0 && <p className="px-1 py-2 text-sm text-[#607080]">選択できる販売枠がありません。</p>}
                        {availableContractSlots.map((slot) => {
                          const product = productById.get(slot.productId);
                          const checked = contractForm.selectedSlotIds.includes(slot.id);
                          return (
                            <label key={slot.id} className="flex cursor-pointer gap-2 rounded-md p-2 hover:bg-[#f6f7f8]">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) =>
                                  setContractForm((current) => ({
                                    ...current,
                                    selectedSlotIds: event.target.checked
                                      ? [...current.selectedSlotIds, slot.id]
                                      : current.selectedSlotIds.filter((id) => id !== slot.id),
                                  }))
                                }
                                className="mt-1"
                              />
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium text-[#172026]">{slot.slotName}</span>
                                <span className="mt-1 block text-xs text-[#607080]">
                                  {product?.displayName || "-"} / {slot.status} / {currency(slot.salesPrice || slot.listPrice)}
                                </span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </label>
                    <div className="rounded-md bg-[#f6f7f8] p-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#607080]">選択枠数</span>
                        <span className="font-semibold">{selectedContractSlots.length}</span>
                      </div>
                      <div className="mt-1 flex justify-between">
                        <span className="text-[#607080]">明細配分額</span>
                        <span className="font-semibold">
                          {currency(selectedContractSlots.reduce((sum, slot) => sum + (slot.salesPrice || slot.listPrice), 0))}
                        </span>
                      </div>
                    </div>
                    <label className="block text-xs font-semibold text-[#607080]">
                      備考
                      <textarea
                        value={contractForm.note}
                        onChange={(event) => setContractForm((current) => ({ ...current, note: event.target.value }))}
                        className="mt-1 h-20 w-full resize-none rounded-md border border-[#ccd3da] px-3 py-2 text-sm text-[#172026]"
                      />
                    </label>
                  </div>
                  {contractMessage && <p className="mt-4 rounded-md bg-[#edf7f4] p-3 text-sm text-[#23594b]">{contractMessage}</p>}
                  <button
                    onClick={submitContractForm}
                    disabled={isPending}
                    className="mt-4 h-10 w-full rounded-md bg-[#172026] px-4 text-sm font-semibold text-white hover:bg-[#2b3741] disabled:opacity-60"
                  >
                    {isPending ? "保存中" : "契約を作成"}
                  </button>
                </aside>
              </section>
            )}

            {activeView === "review" && (
              <section className="grid grid-cols-2 gap-5">
                <div className="col-span-2 rounded-md border border-[#d9dee3] bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">レビュー進捗</h3>
                      <p className="mt-1 text-sm text-[#607080]">保存済みの判断状態で、確認対象を絞り込めます。</p>
                    </div>
                    <label className="text-xs font-semibold text-[#607080]">
                      表示ステータス
                      <select
                        value={reviewStatusFilter}
                        onChange={(event) => setReviewStatusFilter(event.target.value as ReviewStatus | "すべて")}
                        className="mt-1 h-9 rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
                      >
                        <option>すべて</option>
                        {reviewStatusOptions.map((status) => (
                          <option key={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="mt-4 grid grid-cols-5 gap-3">
                    <Metric label="総候補" value={`${reviewSummary.total}`} />
                    {reviewStatusOptions.map((status) => (
                      <Metric key={status} label={status} value={`${reviewSummary.counts[status]}`} />
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-[#d9dee3] bg-white">
                  <div className="border-b border-[#d9dee3] px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">商品マスタ統合候補</h3>
                        <p className="mt-1 text-sm text-[#607080]">同じ商品として扱うべきか確認する候補です。自動統合はまだ行いません。</p>
                      </div>
                      <div className="rounded-md bg-[#f6f7f8] px-3 py-2 text-right">
                        <p className="text-xs text-[#607080]">候補</p>
                        <p className="mt-1 text-lg font-semibold">{filteredProductQualityGroups.length}</p>
                        <p className="text-[11px] text-[#607080]">全{productQualityGroups.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-[#edf0f2]">
                    {productQualityGroups.length === 0 && <p className="p-4 text-sm text-[#607080]">商品マスタの統合候補はありません。</p>}
                    {productQualityGroups.length > 0 && filteredProductQualityGroups.length === 0 && (
                      <p className="p-4 text-sm text-[#607080]">このステータスの商品候補はありません。</p>
                    )}
                    {filteredProductQualityGroups.map((group) => (
                      <article key={group.key} className="p-4">
                        <div className="flex items-center justify-between text-xs text-[#607080]">
                          <span>{group.products.length}商品</span>
                          <span>{group.slotCount}販売枠</span>
                        </div>
                        <ReviewControls
                          note={reviewStates[`product:${group.key}`]?.note || ""}
                          status={reviewStates[`product:${group.key}`]?.status || "未確認"}
                          onChange={(patch) => updateReviewState(`product:${group.key}`, "product", patch)}
                        />
                        <div className="mt-3 space-y-2">
                          {group.products.map((product) => {
                            const productSlots = slots.filter((slot) => slot.productId === product.id);
                            return (
                              <button
                                key={product.id}
                                onClick={() => {
                                  setSelectedProductId(product.id);
                                  setActiveView("products");
                                }}
                                className="block w-full rounded-md border border-[#edf0f2] px-3 py-2 text-left hover:bg-[#f8fafb]"
                              >
                                <p className="truncate text-sm font-semibold">{product.displayName}</p>
                                <p className="mt-1 truncate text-xs text-[#607080]">
                                  {product.categoryLarge} / {product.categoryMiddle} / {product.categorySmall} / {product.categoryDetail}
                                </p>
                                <div className="mt-2 flex justify-between text-xs text-[#607080]">
                                  <span>{product.inventoryType}</span>
                                  <span>{productSlots.length}枠</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-[#d9dee3] bg-white">
                  <div className="border-b border-[#d9dee3] px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">会社名統合候補</h3>
                        <p className="mt-1 text-sm text-[#607080]">会社マスタ、販売枠、提案履歴に出ている表記の揺れ候補です。</p>
                      </div>
                      <div className="rounded-md bg-[#f6f7f8] px-3 py-2 text-right">
                        <p className="text-xs text-[#607080]">候補</p>
                        <p className="mt-1 text-lg font-semibold">{filteredCompanyQualityGroups.length}</p>
                        <p className="text-[11px] text-[#607080]">全{companyQualityGroups.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="divide-y divide-[#edf0f2]">
                    {companyQualityGroups.length === 0 && <p className="p-4 text-sm text-[#607080]">会社名の統合候補はありません。</p>}
                    {companyQualityGroups.length > 0 && filteredCompanyQualityGroups.length === 0 && (
                      <p className="p-4 text-sm text-[#607080]">このステータスの会社候補はありません。</p>
                    )}
                    {filteredCompanyQualityGroups.map((group) => (
                      <article key={group.key} className="p-4">
                        <div className="flex items-center justify-between text-xs text-[#607080]">
                          <span>{group.companies.length}表記</span>
                          <span>
                            {group.slotCount}枠 / {group.proposalCount}提案
                          </span>
                        </div>
                        <ReviewControls
                          note={reviewStates[`company:${group.key}`]?.note || ""}
                          status={reviewStates[`company:${group.key}`]?.status || "未確認"}
                          onChange={(patch) => updateReviewState(`company:${group.key}`, "company", patch)}
                        />
                        <div className="mt-3 space-y-2">
                          {group.companies.map((company) => (
                            <button
                              key={company.name}
                              onClick={() => setActiveView("companies")}
                              className="block w-full rounded-md border border-[#edf0f2] px-3 py-2 text-left hover:bg-[#f8fafb]"
                            >
                              <p className="truncate text-sm font-semibold">{company.name}</p>
                              <p className="mt-1 text-xs text-[#607080]">{company.source.join(" / ")}</p>
                            </button>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeView === "csv" && (
              <section className="grid grid-cols-[1fr_360px] gap-5">
                <div className="rounded-md border border-[#d9dee3] bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">商品マスタ・販売枠CSV</h3>
                      <p className="mt-1 text-sm text-[#607080]">CSV/TSVに対応。分類4列だけでも販売枠として取り込めます。</p>
                    </div>
                    <button
                      onClick={importCsv}
                      disabled={isPending}
                      className="h-9 rounded-md bg-[#172026] px-4 text-sm font-semibold text-white hover:bg-[#2b3741]"
                    >
                      {isPending ? "取り込み中" : "取り込む"}
                    </button>
                  </div>
                  <textarea
                    value={csvText}
                    onChange={(event) => setCsvText(event.target.value)}
                    className="mt-4 h-[430px] w-full resize-none rounded-md border border-[#ccd3da] p-3 font-mono text-xs outline-none focus:border-[#172026]"
                  />
                </div>
                <aside className="rounded-md border border-[#d9dee3] bg-white p-4">
                  <h3 className="font-semibold">取り込みプレビュー</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-md bg-[#f6f7f8] p-3">
                      <p className="text-xs text-[#607080]">新規商品</p>
                      <p className="mt-1 text-lg font-semibold">{csvPreview.products.length}</p>
                    </div>
                    <div className="rounded-md bg-[#f6f7f8] p-3">
                      <p className="text-xs text-[#607080]">販売枠</p>
                      <p className="mt-1 text-lg font-semibold">{csvPreview.slots.length}</p>
                    </div>
                    <div className="rounded-md bg-[#f6f7f8] p-3">
                      <p className="text-xs text-[#607080]">DB商品候補</p>
                      <p className="mt-1 text-lg font-semibold">{csvPreview.actionProducts.length}</p>
                    </div>
                    <div className="rounded-md bg-[#f6f7f8] p-3">
                      <p className="text-xs text-[#607080]">警告</p>
                      <p className="mt-1 text-lg font-semibold">{csvPreview.warnings.length}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-semibold">先頭プレビュー</h4>
                    <div className="mt-2 max-h-56 overflow-auto rounded-md border border-[#edf0f2]">
                      {csvPreview.slots.length === 0 && <p className="p-3 text-sm text-[#607080]">取り込める販売枠がありません。</p>}
                      {csvPreview.slots.slice(0, 8).map((slot) => {
                        const product = csvPreview.products.find((item) => item.id === slot.productId) || products.find((item) => item.id === slot.productId);
                        return (
                          <div key={slot.id} className="border-t border-[#edf0f2] px-3 py-2 first:border-t-0">
                            <p className="truncate text-sm font-semibold">{slot.slotName}</p>
                            <p className="mt-1 truncate text-xs text-[#607080]">
                              {product?.displayName || "-"} / {product?.inventoryType || "-"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 border-t border-[#d9dee3] pt-4">
                    <h3 className="font-semibold">取り込み仕様</h3>
                    <ul className="mt-3 space-y-2 text-sm text-[#405060]">
                      <li>スプレッドシートからのタブ貼り付けに対応</li>
                      <li>必須は商品分類_大。分類4列だけでも取り込み可能</li>
                      <li>表示商品名は未入力なら4階層分類から生成</li>
                      <li>在庫タイプ未入力時は内容から自動推定</li>
                      <li>同一商品は販売枠を複数作成</li>
                      <li>既存更新はしない</li>
                      <li>販売枠ステータスは未販売で作成</li>
                      <li>対象試合のあいまい紐づけはしない</li>
                    </ul>
                  </div>
                  {lastImportSummary && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{lastImportSummary}</p>}
                  {(csvWarnings.length > 0 || csvPreview.warnings.length > 0) && (
                    <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                      {(csvWarnings.length ? csvWarnings : csvPreview.warnings).map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  )}
                </aside>
              </section>
            )}

            {activeView === "report" && (
              <section className="rounded-md border border-[#d9dee3] bg-white">
                <div className="border-b border-[#d9dee3] px-4 py-3">
                  <h3 className="font-semibold">商品分類別 売上・粗利</h3>
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f1f3f5] text-left text-xs font-semibold text-[#607080]">
                      <tr>
                        <th className="px-4 py-3">分類</th>
                        <th className="px-3 py-3">枠数</th>
                        <th className="px-3 py-3">提案中</th>
                        <th className="px-3 py-3">仮押さえ</th>
                        <th className="px-3 py-3">契約済み</th>
                        <th className="px-3 py-3">売上</th>
                        <th className="px-3 py-3">粗利</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(
                        slots.reduce<Record<string, Slot[]>>((groups, slot) => {
                          const product = productById.get(slot.productId);
                          const key = product?.categoryLarge || "未分類";
                          groups[key] = [...(groups[key] || []), slot];
                          return groups;
                        }, {}),
                      ).map(([category, categorySlots]) => {
                        const revenue = categorySlots.reduce((sum, slot) => sum + (slot.salesPrice || slot.listPrice), 0);
                        const gross = categorySlots.reduce((sum, slot) => sum + (slot.salesPrice || slot.listPrice) - slot.cost, 0);
                        return (
                          <tr key={category} className="border-t border-[#edf0f2]">
                            <td className="px-4 py-3 font-medium">{category}</td>
                            <td className="px-3 py-3">{categorySlots.length}</td>
                            <td className="px-3 py-3">{categorySlots.filter((slot) => slot.status === "提案中").length}</td>
                            <td className="px-3 py-3">{categorySlots.filter((slot) => slot.status === "仮押さえ").length}</td>
                            <td className="px-3 py-3">{categorySlots.filter((slot) => slot.status === "契約済み").length}</td>
                            <td className="px-3 py-3 font-medium">{currency(revenue)}</td>
                            <td className="px-3 py-3 font-medium">{currency(gross)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d9dee3] bg-white px-4 py-3">
      <p className="text-xs font-medium text-[#607080]">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#607080]">{label}</p>
      <p className="mt-1 text-sm text-[#172026]">{value}</p>
    </div>
  );
}

function CreateSlotPanel({
  form,
  products,
  companies,
  isPending,
  message,
  onChange,
  onCancel,
  onSubmit,
}: {
  form: CreateForm;
  products: Product[];
  companies: Company[];
  isPending: boolean;
  message: string;
  onChange: (patch: Partial<CreateForm>) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <aside className="rounded-md border border-[#d9dee3] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#607080]">新規作成</p>
          <h3 className="mt-1 text-lg font-semibold leading-6">販売枠を追加</h3>
        </div>
        <button onClick={onCancel} className="rounded-md border border-[#ccd3da] px-2 py-1 text-xs font-medium">
          閉じる
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-md bg-[#f6f7f8] p-1">
        <button
          onClick={() => onChange({ productMode: "existing" })}
          className={`rounded px-3 py-2 text-sm font-medium ${form.productMode === "existing" ? "bg-white shadow-sm" : "text-[#607080]"}`}
        >
          既存商品
        </button>
        <button
          onClick={() => onChange({ productMode: "new" })}
          className={`rounded px-3 py-2 text-sm font-medium ${form.productMode === "new" ? "bg-white shadow-sm" : "text-[#607080]"}`}
        >
          新商品
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {form.productMode === "existing" ? (
          <label className="block text-xs font-semibold text-[#607080]">
            商品
            <select
              value={form.productId}
              onChange={(event) => onChange({ productId: event.target.value })}
              className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.displayName}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <TextInput label="表示商品名" value={form.displayName} onChange={(value) => onChange({ displayName: value })} />
            <div className="grid grid-cols-2 gap-2">
              <TextInput label="分類_大" value={form.categoryLarge} onChange={(value) => onChange({ categoryLarge: value })} />
              <TextInput label="分類_中" value={form.categoryMiddle} onChange={(value) => onChange({ categoryMiddle: value })} />
              <TextInput label="分類_小" value={form.categorySmall} onChange={(value) => onChange({ categorySmall: value })} />
              <TextInput label="分類_詳細" value={form.categoryDetail} onChange={(value) => onChange({ categoryDetail: value })} />
            </div>
            <label className="block text-xs font-semibold text-[#607080]">
              在庫タイプ
              <select
                value={form.inventoryType}
                onChange={(event) => onChange({ inventoryType: event.target.value as InventoryType })}
                className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
              >
                {inventoryTypeOptions.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          </>
        )}

        <TextInput label="販売枠名" value={form.slotName} onChange={(value) => onChange({ slotName: value })} />
        <div className="grid grid-cols-2 gap-2">
          <TextInput label="枠番号" value={form.slotNumber} onChange={(value) => onChange({ slotNumber: value })} />
          <TextInput label="シーズン" value={form.season} onChange={(value) => onChange({ season: value })} />
        </div>
        <TextInput label="対象試合" value={form.targetMatch} onChange={(value) => onChange({ targetMatch: value })} />
        <TextInput label="場所" value={form.location} onChange={(value) => onChange({ location: value })} />
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-semibold text-[#607080]">
            会社
            <select
              value={form.company}
              onChange={(event) => onChange({ company: event.target.value })}
              className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
            >
              <option value="">未設定</option>
              {companies.map((company) => (
                <option key={company.id} value={company.name}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
          <TextInput label="担当" value={form.owner} onChange={(value) => onChange({ owner: value })} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <TextInput label="定価" value={form.listPrice} onChange={(value) => onChange({ listPrice: value })} type="number" />
          <TextInput label="販売価格" value={form.salesPrice} onChange={(value) => onChange({ salesPrice: value })} type="number" />
          <TextInput label="原価" value={form.cost} onChange={(value) => onChange({ cost: value })} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-xs font-semibold text-[#607080]">
            ステータス
            <select
              value={form.status}
              onChange={(event) => onChange({ status: event.target.value as SlotStatus })}
              className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
            >
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#607080]">
            制作
            <select
              value={form.productionStatus}
              onChange={(event) => onChange({ productionStatus: event.target.value as ProductionStatus })}
              className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-3 text-sm text-[#172026]"
            >
              {productionOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        <TextInput label="制作期限" value={form.productionDue} onChange={(value) => onChange({ productionDue: value })} type="date" />
        <label className="block text-xs font-semibold text-[#607080]">
          仕様詳細
          <textarea
            value={form.specDetail}
            onChange={(event) => onChange({ specDetail: event.target.value })}
            className="mt-1 h-20 w-full resize-none rounded-md border border-[#ccd3da] px-3 py-2 text-sm text-[#172026]"
          />
        </label>
      </div>

      {message && <p className="mt-4 rounded-md bg-[#edf7f4] p-3 text-sm text-[#23594b]">{message}</p>}

      <button
        onClick={onSubmit}
        disabled={isPending}
        className="mt-4 h-10 w-full rounded-md bg-[#172026] px-4 text-sm font-semibold text-white hover:bg-[#2b3741] disabled:opacity-60"
      >
        {isPending ? "保存中" : "販売枠を作成"}
      </button>
    </aside>
  );
}

function ReviewControls({
  note,
  status,
  onChange,
}: {
  note: string;
  status: ReviewStatus;
  onChange: (patch: Partial<ReviewState>) => void;
}) {
  return (
    <div className="mt-3 rounded-md bg-[#f6f7f8] p-3">
      <div className="grid grid-cols-[130px_1fr] gap-2">
        <label className="block text-xs font-semibold text-[#607080]">
          判断
          <select
            value={status}
            onChange={(event) => onChange({ status: event.target.value as ReviewStatus })}
            className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] bg-white px-2 text-sm text-[#172026]"
          >
            {reviewStatusOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-[#607080]">
          メモ
          <input
            value={note}
            onChange={(event) => onChange({ note: event.target.value })}
            className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] px-3 text-sm text-[#172026]"
            placeholder="確認内容や次アクション"
          />
        </label>
      </div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-[#607080]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        className="mt-1 h-9 w-full rounded-md border border-[#ccd3da] px-3 text-sm text-[#172026]"
      />
    </label>
  );
}
