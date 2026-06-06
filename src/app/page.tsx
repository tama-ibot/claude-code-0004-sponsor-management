import SponsorshipApp, { type Contract, type ContractItem, type Product, type Proposal, type ReviewState, type Slot } from "./app-client";
import LoginClient from "./login-client";
import { getCurrentProfile, getCurrentUser, isSupabaseProvider } from "@/lib/auth";
import { getAppData } from "@/lib/data-provider";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (isSupabaseProvider()) {
    const user = await getCurrentUser();
    if (!user) return <LoginClient />;

    const profile = await getCurrentProfile();
    if (!profile) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#eef1f4] p-6 text-[#172026]">
          <section className="w-full max-w-[520px] rounded-md border border-[#d9dee3] bg-white p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#607080]">Account Setup</p>
            <h1 className="mt-2 text-2xl font-semibold">プロフィール未設定</h1>
            <p className="mt-3 text-sm leading-6 text-[#607080]">
              Supabase Authのユーザーは作成されていますが、`profiles` にロール情報がありません。管理者がこのユーザーIDを
              `profiles` に登録すると利用できます。
            </p>
            <div className="mt-4 rounded-md bg-[#f6f7f8] p-3 font-mono text-xs text-[#172026]">{user.id}</div>
            <a
              href="/auth/sign-out"
              className="mt-5 inline-flex h-9 items-center rounded-md border border-[#ccd3da] px-3 text-sm font-semibold hover:bg-[#f1f3f5]"
            >
              ログアウト
            </a>
          </section>
        </main>
      );
    }
  }

  const profile = await getCurrentProfile();
  const { products, slots, companies, proposals, contracts, contractItems, reviewStates } = await getAppData();

  const initialProducts: Product[] = products.map((product) => ({
    id: product.id,
    displayName: product.displayName,
    categoryLarge: product.categoryLarge,
    categoryMiddle: product.categoryMiddle,
    categorySmall: product.categorySmall,
    categoryDetail: product.categoryDetail,
    inventoryType: product.inventoryType as Product["inventoryType"],
    standardPrice: product.standardPrice,
    standardCost: product.standardCost,
    standardSpec: product.standardSpec,
  }));

  const initialSlots: Slot[] = slots.map((slot) => ({
    id: slot.id,
    productId: slot.productId,
    slotName: slot.slotName,
    slotNumber: slot.slotNumber,
    season: slot.season,
    targetMatch: slot.targetMatch,
    location: slot.location,
    status: slot.status as Slot["status"],
    company: slot.company,
    owner: slot.owner,
    listPrice: slot.listPrice,
    salesPrice: slot.salesPrice,
    cost: slot.cost,
    productionDue: slot.productionDue,
    productionStatus: slot.productionStatus as Slot["productionStatus"],
    specDetail: slot.specDetail,
    inspectionStatus: slot.inspectionStatus as Slot["inspectionStatus"],
    evidenceUrls: slot.evidenceUrls,
    inspectionNote: slot.inspectionNote,
    inspectedAt: slot.inspectedAt,
  }));

  const initialProposals: Proposal[] = proposals.map((proposal) => ({
    id: proposal.id,
    slotId: proposal.slotId,
    companyName: proposal.companyName,
    proposedDate: proposal.proposedDate,
    status: proposal.status as Proposal["status"],
    proposedPrice: proposal.proposedPrice,
    owner: proposal.owner,
    lostReason: proposal.lostReason,
    note: proposal.note,
  }));

  const initialContracts: Contract[] = contracts.map((contract) => ({
    id: contract.id,
    companyName: contract.companyName,
    name: contract.name,
    season: contract.season,
    startDate: contract.startDate,
    endDate: contract.endDate,
    totalAmount: contract.totalAmount,
    status: contract.status as Contract["status"],
    billingStatus: contract.billingStatus as Contract["billingStatus"],
    owner: contract.owner,
    note: contract.note,
  }));

  const initialContractItems: ContractItem[] = contractItems.map((item) => ({
    id: item.id,
    contractId: item.contractId,
    slotId: item.slotId,
    itemName: item.itemName,
    allocatedAmount: item.allocatedAmount,
    cost: item.cost,
    note: item.note,
  }));

  const initialReviewStates: Record<string, ReviewState> = Object.fromEntries(
    reviewStates.map((state) => [
      state.reviewKey,
      {
        status: state.status as ReviewState["status"],
        note: state.note,
      },
    ]),
  );

  return (
    <SponsorshipApp
      initialProducts={initialProducts}
      initialSlots={initialSlots}
      initialCompanies={companies}
      initialProposals={initialProposals}
      initialContracts={initialContracts}
      initialContractItems={initialContractItems}
      initialReviewStates={initialReviewStates}
      currentUser={
        profile
          ? {
              name: profile.displayName,
              role: profile.role,
            }
          : undefined
      }
    />
  );
}
