import supabase from "@/lib/supabaseClient";

type ActionName = "INITIATE" | "FUND" | "RELEASE" | "REFUND";

export interface InitiatePayload {
  sellerWallet: string;
  buyerWallet: string;
  amount: string;
  feeBps?: number;
  deliverBy?: number;
  disputeDeadline?: number;
  description?: string;
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

const jsonHeaders = { "Content-Type": "application/json" };
const ACTIONS_BASE_URL = import.meta.env.VITE_ACTIONS_SERVER_URL || 'http://localhost:4000';

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
  });
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
  if (actorWallet && deal.buyer_wallet !== actorWallet) throw new Error("Only the buyer can release funds");
  if (!deal.buyer_wallet) throw new Error("Deal missing buyer wallet");
  return request<ActionResponse>("/actions/release", {
    dealId,
    buyerWallet: deal.buyer_wallet,
  });
}

export async function refund(dealId: string, actorWallet?: string): Promise<ActionResponse> {
  const deal = await fetchDealRow(dealId);
  if (actorWallet && deal.seller_wallet !== actorWallet) throw new Error("Only the seller can refund this deal");
  if (!deal.seller_wallet) throw new Error("Deal missing seller wallet");
  return request<ActionResponse>("/actions/refund", {
    dealId,
    sellerWallet: deal.seller_wallet,
  });
}

export async function confirm(payload: ConfirmPayload) {
  let actorWallet = payload.actorWallet;
  if (!actorWallet) {
    const deal = await fetchDealRow(payload.dealId);
    actorWallet =
      payload.action === "FUND" || payload.action === "RELEASE" ? deal.buyer_wallet ?? undefined : deal.seller_wallet ?? undefined;
  }
  if (!actorWallet) throw new Error("Unable to resolve actor wallet");
  return request("/actions/confirm", {
    dealId: payload.dealId,
    txSig: payload.txSig,
    action: payload.action,
    actorWallet,
  });
}

export const actionsService = {
  initiate,
  fund,
  release,
  refund,
  confirm,
};

export default actionsService;
