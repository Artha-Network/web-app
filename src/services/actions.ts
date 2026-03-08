import supabase from "@/lib/supabaseClient";

type ActionName = "INITIATE" | "FUND" | "RELEASE" | "REFUND" | "OPEN_DISPUTE";

export interface InitiatePayload {
  sellerWallet: string;
  buyerWallet: string;
  amount: string;
  feeBps?: number;
  deliverBy?: number;
  disputeDeadline?: number;
  description?: string;
  title?: string;
  buyerEmail?: string;
  sellerEmail?: string;
  vin?: string;
  contract?: string;
  payer: string;
  metadata?: Record<string, unknown>;
}

export interface CarEscrowPlan {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  reasons: string[];
  deliveryDeadlineHoursFromNow: number;
  disputeWindowHours: number;
  reminderMinutesBefore: number[];
  deliveryDeadlineAtIso: string;
  disputeWindowEndsAtIso: string;
}

export interface CarEscrowPlanInput {
  priceUsd: number;
  deliveryType: "local_pickup" | "same_city_carrier" | "cross_country_carrier";
  hasTitleInHand: boolean;
  odometerMiles: number;
  year: number;
  isSalvageTitle?: boolean;
}

export interface ActionResponse {
  dealId: string;
  txMessageBase64: string;
  nextClientAction?: string;
  latestBlockhash: string;
  lastValidBlockHeight: number;
  feePayer: string;
}

interface ConfirmPayload {
  dealId: string;
  txSig: string;
  action: ActionName;
  actorWallet?: string;
}

interface DealRow {
  id: string;
  price_usd: string;
  buyer_wallet: string | null;
  seller_wallet: string | null;
}

export interface EvidenceItem {
  id: string;
  deal_id: string;
  description: string;
  mime_type: string;
  submitted_by: string;
  submitted_by_name: string | null;
  submitted_at: string;
  role: "buyer" | "seller";
}

export interface EvidenceListResponse {
  evidence: EvidenceItem[];
  total: number;
}

export interface ArbitrationResponse {
  ticket: {
    outcome: "RELEASE" | "REFUND";
    confidence: number;
    rationale_cid: string | null;
    expires_at_utc: string;
  };
  arbiter_pubkey: string;
  ed25519_signature: string;
}

export interface ResolutionResponse {
  deal_id: string;
  outcome: "RELEASE" | "REFUND";
  confidence: number;
  reason_short: string;
  rationale_cid: string | null;
  violated_rules: string[];
  arbiter_pubkey: string;
  signature: string;
  issued_at: string;
  expires_at: string | null;
}

const jsonHeaders = { "Content-Type": "application/json" };
import { API_BASE as ACTIONS_BASE_URL } from '../lib/config';

async function request<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const url = `${ACTIONS_BASE_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const payload = (await res.json()) as { error?: string };
      if (payload?.error) message = payload.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

async function requestGet<T>(path: string): Promise<T> {
  const url = `${ACTIONS_BASE_URL}${path}`;
  const res = await fetch(url, { credentials: "include" });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const payload = (await res.json()) as { error?: string };
      if (payload?.error) message = payload.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

async function fetchDealRow(dealId: string): Promise<DealRow> {
  const { data, error } = await supabase
    .from("deals")
    .select("id, price_usd, buyer_wallet, seller_wallet")
    .eq("id", dealId)
    .single<DealRow>();
  if (error || !data) {
    throw new Error(error?.message ?? "Deal not found");
  }
  return data;
}

export async function initiate(payload: InitiatePayload): Promise<ActionResponse> {
  return request<ActionResponse>("/actions/initiate", {
    sellerWallet: payload.sellerWallet,
    buyerWallet: payload.buyerWallet,
    amount: payload.amount,
    feeBps: payload.feeBps ?? 0,
    deliverBy: payload.deliverBy,
    disputeDeadline: payload.disputeDeadline,
    description: payload.description,
    title: payload.title,
    buyerEmail: payload.buyerEmail,
    sellerEmail: payload.sellerEmail,
    payer: payload.payer,
    metadata: payload.metadata,
  });
}

export async function fetchCarEscrowPlan(input: CarEscrowPlanInput): Promise<CarEscrowPlan> {
  const result = await request<{ ok: boolean; plan: CarEscrowPlan }>("/api/deals/car-escrow/plan", input as unknown as Record<string, unknown>);
  return result.plan;
}

export async function fund(dealId: string, actorWallet?: string): Promise<ActionResponse> {
  const deal = await fetchDealRow(dealId);
  if (actorWallet && deal.buyer_wallet !== actorWallet) throw new Error("Only the buyer can fund this deal");
  if (!deal.buyer_wallet) throw new Error("Deal missing buyer wallet");
  return request<ActionResponse>("/actions/fund", {
    dealId,
    buyerWallet: deal.buyer_wallet,
    amount: deal.price_usd,
  });
}

export async function release(dealId: string, actorWallet?: string): Promise<ActionResponse> {
  const deal = await fetchDealRow(dealId);
  // On-chain Release requires seller to sign (claim pattern after arbiter verdict)
  if (actorWallet && deal.seller_wallet !== actorWallet) throw new Error("Only the seller can release funds");
  if (!deal.seller_wallet) throw new Error("Deal missing seller wallet");
  return request<ActionResponse>("/actions/release", {
    dealId,
    sellerWallet: deal.seller_wallet,
  });
}

export async function refund(dealId: string, actorWallet?: string): Promise<ActionResponse> {
  const deal = await fetchDealRow(dealId);
  // On-chain Refund requires buyer to sign (claim pattern after arbiter verdict)
  if (actorWallet && deal.buyer_wallet !== actorWallet) throw new Error("Only the buyer can claim a refund");
  if (!deal.buyer_wallet) throw new Error("Deal missing buyer wallet");
  return request<ActionResponse>("/actions/refund", {
    dealId,
    buyerWallet: deal.buyer_wallet,
  });
}

export async function openDispute(dealId: string, callerWallet: string): Promise<ActionResponse> {
  return request<ActionResponse>("/actions/open-dispute", {
    dealId,
    callerWallet,
  });
}

export async function confirmDelivery(dealId: string, buyerWallet: string) {
  return request("/actions/confirm-delivery", { dealId, buyerWallet });
}

export async function approveRefund(dealId: string, sellerWallet: string) {
  return request("/actions/approve-refund", { dealId, sellerWallet });
}

export async function confirm(payload: ConfirmPayload) {
  let actorWallet = payload.actorWallet;
  if (!actorWallet) {
    const deal = await fetchDealRow(payload.dealId);
    // FUND = buyer, RELEASE = seller (seller claims), REFUND = buyer (buyer claims)
    if (payload.action === "RELEASE") {
      actorWallet = deal.seller_wallet ?? undefined;
    } else if (payload.action === "REFUND") {
      actorWallet = deal.buyer_wallet ?? undefined;
    } else {
      actorWallet = deal.buyer_wallet ?? undefined;
    }
  }
  if (!actorWallet) throw new Error("Unable to resolve actor wallet");
  return request("/actions/confirm", {
    dealId: payload.dealId,
    txSig: payload.txSig,
    action: payload.action,
    actorWallet,
  });
}

export async function submitEvidence(
  dealId: string,
  description: string,
  walletAddress: string,
  type?: string
): Promise<EvidenceItem> {
  return request<EvidenceItem>(`/api/deals/${dealId}/evidence`, {
    description,
    wallet_address: walletAddress,
    type: type ?? "text/plain",
  });
}

export async function fetchEvidence(dealId: string): Promise<EvidenceListResponse> {
  return requestGet<EvidenceListResponse>(`/api/deals/${dealId}/evidence`);
}

export async function triggerArbitration(dealId: string): Promise<ArbitrationResponse> {
  return request<ArbitrationResponse>(`/api/deals/${dealId}/arbitrate`, {});
}

export async function fetchResolution(dealId: string): Promise<ResolutionResponse> {
  return requestGet<ResolutionResponse>(`/api/deals/${dealId}/resolution`);
}

export const actionsService = {
  initiate,
  fund,
  release,
  refund,
  openDispute,
  confirmDelivery,
  approveRefund,
  confirm,
  submitEvidence,
  fetchEvidence,
  triggerArbitration,
  fetchResolution,
  fetchCarEscrowPlan,
};

export default actionsService;
