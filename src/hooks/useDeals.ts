import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/lib/config";

const ACTIONS_BASE_URL = API_BASE;

export interface DealRow {
  id: string;
  title?: string;
  description?: string;
  status: string;
  price_usd: string;
  buyer_wallet: string | null;
  seller_wallet: string | null;
  buyer_email?: string | null;
  seller_email?: string | null;
  deliver_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealWithEvents extends DealRow {
  description?: string;
  vin?: string | null;
  contract?: string | null;
  dispute_deadline?: string | null;
  funded_at?: string | null;
  fee_bps?: number;
  onchain_address?: string;
  buyer?: { display_name?: string | null; reputation_score?: number } | null;
  seller_profile?: { display_name?: string | null; reputation_score?: number } | null;
  transaction_hash?: string;
  metadata?: Record<string, unknown> | null;
  ai_resolution?: {
    decision: string;
    confidence: number;
    resolved_at: string;
  };
  onchain_events?: Array<{
    id: string;
    tx_sig: string;
    slot: string;
    instruction: string;
    created_at: string;
  }>;
}

interface PaginatedDeals {
  deals: DealRow[];
  total: number;
}

export interface DealEventRow {
  id: string;
  deal_id: string;
  tx_sig: string;
  instruction: string;
  created_at: string;
  deal_title?: string | null;
  deal_status?: string | null;
  deal_amount?: string | null;
}

const DEFAULT_PAGE_SIZE = 12;

async function fetchDealsForWallet(wallet: string, page: number, pageSize: number): Promise<PaginatedDeals> {
  const offset = page * pageSize;
  const response = await fetch(`${ACTIONS_BASE_URL}/api/deals?wallet_address=${wallet}&offset=${offset}&limit=${pageSize}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch deals: ${response.status}`);
  }

  return await response.json();
}

async function fetchDealById(dealId: string): Promise<DealWithEvents> {
  const response = await fetch(`${ACTIONS_BASE_URL}/api/deals/${dealId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch deal: ${response.status}`);
  }

  const data = await response.json();

  // Backend now returns proper snake_case, but keep fallbacks for safety
  return {
    ...data,
    id: data.id,
    title: data.title || null,
    description: data.description || null,
    buyer_wallet: data.buyer_wallet || data.buyerWallet || null,
    seller_wallet: data.seller_wallet || data.sellerWallet || null,
    buyer_email: data.buyer_email || data.buyerEmail || null,
    seller_email: data.seller_email || data.sellerEmail || null,
    deliver_deadline: data.deliver_deadline || data.deliverDeadline || null,
    dispute_deadline: data.dispute_deadline || data.disputeDeadline || null,
    funded_at: data.funded_at || data.fundedAt || null,
    price_usd: data.price_usd || (data.priceUsd ? data.priceUsd.toString() : "0"),
    fee_bps: data.fee_bps ?? data.feeBps ?? 0,
    vin: data.vin || null,
    contract: data.contract || null,
    onchain_address: data.onchain_address || data.onchainAddress || null,
    status: data.status,
    created_at: data.created_at || data.createdAt || new Date().toISOString(),
    updated_at: data.updated_at || data.updatedAt || new Date().toISOString(),
    buyer: data.buyer || null,
    seller_profile: data.seller || null,
    onchain_events: data.onchain_events || data.onchainEvents || [],
    transaction_hash: data.transaction_hash || data.transactionHash,
    ai_resolution: data.ai_resolution || data.aiResolution,
    metadata: data.metadata ?? null,
  };
}

async function fetchRecentEvents(wallet: string, limit: number): Promise<DealEventRow[]> {
  const response = await fetch(`${ACTIONS_BASE_URL}/api/deals/events/recent?wallet_address=${wallet}&limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`);
  }

  const raw = await response.json();
  // Backend returns camelCase with nested deal object; normalize to flat snake_case
  return (raw as any[]).map((evt) => ({
    id: evt.id,
    deal_id: evt.dealId || evt.deal_id,
    tx_sig: evt.txSig || evt.tx_sig,
    instruction: evt.instruction,
    created_at: evt.createdAt || evt.created_at,
    deal_title: evt.deal?.title || null,
    deal_status: evt.deal?.status || null,
    deal_amount: evt.deal?.priceUsd?.toString() || null,
  }));
}

async function deleteDeal(dealId: string): Promise<void> {
  const response = await fetch(`${ACTIONS_BASE_URL}/api/deals/${dealId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to delete deal: ${response.status}`);
  }
}

export function useMyDeals(options?: { page?: number; pageSize?: number }) {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  const page = options?.page ?? 0;
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;

  return useQuery({
    queryKey: ["my-deals", wallet, page, pageSize],
    queryFn: () => fetchDealsForWallet(wallet!, page, pageSize),
    enabled: Boolean(wallet),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}

const ACTIVE_STATUSES = new Set(["INIT", "FUNDED", "DISPUTED"]);
const POLL_INTERVAL_MS = 15_000;

export function useDeal(dealId?: string) {
  return useQuery({
    queryKey: ["deal", dealId],
    queryFn: () => fetchDealById(dealId!),
    enabled: Boolean(dealId),
    refetchInterval: (query) => {
      const status = (query.state.data as DealRow | undefined)?.status;
      return status && ACTIVE_STATUSES.has(status) ? POLL_INTERVAL_MS : false;
    },
    refetchIntervalInBackground: false,
  });
}

export interface ResolutionData {
  outcome: string;
  confidence: number;
  rationale_cid: string;
  arbiter_pubkey: string;
  signature: string;
  issued_at: string;
  expires_at: string | null;
}

async function fetchResolution(dealId: string): Promise<ResolutionData> {
  const response = await fetch(`${ACTIONS_BASE_URL}/api/deals/${dealId}/resolution`);
  if (!response.ok) {
    throw new Error(`No resolution: ${response.status}`);
  }
  return await response.json();
}

export function useResolution(dealId?: string) {
  return useQuery({
    queryKey: ["resolution", dealId],
    queryFn: () => fetchResolution(dealId!),
    enabled: Boolean(dealId),
    retry: false,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}

export function useRecentDealEvents(limit = 10) {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  return useQuery({
    queryKey: ["deal-events", wallet, limit],
    queryFn: () => fetchRecentEvents(wallet!, limit),
    enabled: Boolean(wallet),
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}

export function useDealSummary(deal?: DealRow, viewerWallet?: string | null) {
  return useMemo(() => {
    if (!deal) return null;
    const amount = Number(deal.price_usd ?? 0);
    const counterparty =
      viewerWallet && deal.buyer_wallet === viewerWallet ? deal.seller_wallet : deal.buyer_wallet ?? deal.seller_wallet ?? "—";
    return {
      id: deal.id,
      status: deal.status,
      amount,
      counterparty,
      deadline: deal.deliver_deadline,
    };
  }, [deal, viewerWallet]);
}

export function statusToBadge(status: string): string {
  switch (status) {
    case "INIT":
    case "INITIATED":
      return "INIT";
    case "FUNDED":
      return "FUNDED";
    case "DISPUTED":
      return "DISPUTED";
    case "RELEASED":
    case "RESOLVED":
      return "RESOLVED";
    case "REFUNDED":
      return "REFUNDED";
    case "DELIVERED":
      return "DELIVERED";
    default:
      return "INIT";
  }
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-deals"] });
    },
  });
}
