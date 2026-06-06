import SponsorshipApp, { type Contract, type ContractItem, type Product, type Proposal, type ReviewState, type Slot } from "./app-client";
import { getAppData } from "@/lib/data-provider";

export const dynamic = "force-dynamic";

export default async function Home() {
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
    />
  );
}
