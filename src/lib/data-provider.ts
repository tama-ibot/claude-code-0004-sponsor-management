import {
  createCompanyRecord,
  createContractRecord,
  createProductAndSlot,
  createProposalRecord,
  getAppData as getSqliteAppData,
  insertImportedData,
  updateSlotRecord,
  upsertReviewStateRecord,
} from "./db";
import {
  createSupabaseCompanyRecord,
  createSupabaseContractRecord,
  createSupabaseProductAndSlot,
  createSupabaseProposalRecord,
  createSupabaseUserAccount,
  getSupabaseAppData,
  getSupabaseUserAccounts,
  insertSupabaseImportedData,
  updateSupabaseSlotRecord,
  upsertSupabaseReviewStateRecord,
} from "./supabase-db";
import { isSupabaseProvider } from "./auth";

export async function getAppData() {
  if (isSupabaseProvider()) return getSupabaseAppData();
  return getSqliteAppData();
}

export async function updateSlot(slotId: string, patch: Parameters<typeof updateSupabaseSlotRecord>[1]) {
  if (isSupabaseProvider()) return updateSupabaseSlotRecord(slotId, patch);
  return updateSlotRecord(slotId, patch);
}

export async function createCompany(input: Parameters<typeof createSupabaseCompanyRecord>[0]) {
  if (isSupabaseProvider()) return createSupabaseCompanyRecord(input);
  return createCompanyRecord(input);
}

export async function createProposal(input: Parameters<typeof createSupabaseProposalRecord>[0]) {
  if (isSupabaseProvider()) return createSupabaseProposalRecord(input);
  return createProposalRecord(input);
}

export async function createContract(input: Parameters<typeof createSupabaseContractRecord>[0]) {
  if (isSupabaseProvider()) return createSupabaseContractRecord(input);
  return createContractRecord(input);
}

export async function upsertReviewState(input: Parameters<typeof upsertSupabaseReviewStateRecord>[0]) {
  if (isSupabaseProvider()) return upsertSupabaseReviewStateRecord(input);
  return upsertReviewStateRecord(input);
}

export async function importData(
  products: Parameters<typeof insertSupabaseImportedData>[0],
  slots: Parameters<typeof insertSupabaseImportedData>[1],
) {
  if (isSupabaseProvider()) return insertSupabaseImportedData(products, slots);
  return insertImportedData(products, slots);
}

export async function createSlot(input: Parameters<typeof createSupabaseProductAndSlot>[0]) {
  if (isSupabaseProvider()) return createSupabaseProductAndSlot(input);
  return createProductAndSlot(input);
}

export async function getUserAccounts() {
  if (isSupabaseProvider()) return getSupabaseUserAccounts();
  return [];
}

export async function createUserAccount(input: Parameters<typeof createSupabaseUserAccount>[0]) {
  if (isSupabaseProvider()) return createSupabaseUserAccount(input);
  throw new Error("ユーザー管理はSupabaseモードでのみ利用できます。");
}
