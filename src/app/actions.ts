"use server";

import { revalidatePath } from "next/cache";
import {
  createCompanyRecord,
  createContractRecord,
  createProductAndSlot,
  createProposalRecord,
  insertImportedData,
  updateSlotRecord,
  upsertReviewStateRecord,
} from "@/lib/db";

export type SlotPatch = {
  status?: string;
  company?: string;
  salesPrice?: number;
  productionStatus?: string;
  inspectionStatus?: string;
  evidenceUrls?: string;
  inspectionNote?: string;
  inspectedAt?: string;
};

export type ImportedProductInput = {
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

export type ImportedSlotInput = {
  productKey: string;
  slotName: string;
  slotNumber: string;
  season: string;
  targetMatch: string;
  location: string;
  listPrice: number;
  cost: number;
  specDetail: string;
};

export type CreateSlotInput = {
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
};

export type CreateCompanyInput = {
  name: string;
  industry: string;
  owner: string;
  status: string;
  note: string;
};

export type CreateProposalInput = {
  slotId: string;
  companyName: string;
  proposedDate: string;
  status: string;
  proposedPrice: number;
  owner: string;
  lostReason: string;
  note: string;
};

export type CreateContractInput = {
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
};

export type UpsertReviewStateInput = {
  reviewKey: string;
  reviewType: string;
  status: string;
  note: string;
};

export async function updateInventorySlot(slotId: string, patch: SlotPatch) {
  updateSlotRecord(slotId, patch);
  revalidatePath("/");
}

export async function importProductsAndSlots(
  products: ImportedProductInput[],
  slots: ImportedSlotInput[],
) {
  const summary = insertImportedData(products, slots);
  revalidatePath("/");
  return summary;
}

export async function createSlot(input: CreateSlotInput) {
  const created = createProductAndSlot(input);
  revalidatePath("/");
  return created;
}

export async function createCompany(input: CreateCompanyInput) {
  const created = createCompanyRecord(input);
  revalidatePath("/");
  return created;
}

export async function createProposal(input: CreateProposalInput) {
  const created = createProposalRecord(input);
  revalidatePath("/");
  return created;
}

export async function createContract(input: CreateContractInput) {
  const created = createContractRecord(input);
  revalidatePath("/");
  return created;
}

export async function upsertReviewState(input: UpsertReviewStateInput) {
  const saved = upsertReviewStateRecord(input);
  revalidatePath("/");
  return saved;
}
