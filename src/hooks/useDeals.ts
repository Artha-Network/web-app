import { useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ACTIONS_BASE_URL = import.meta.env.VITE_ACTIONS_SERVER_URL || 'http://localhost:4000';

export interface DealRow {
  id: string;
  title?: string;
  status: string;
  price_usd: string;
  buyer_wallet: string | null;
  seller_wallet: string | null;
  deliver_deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface DealWithEvents extends DealRow {
  description?: string;
  transaction_hash?: string;
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

interface DealEventRow {
  id: string;
  deal_id: string;
  tx_sig: string;
  instruction: string;
  created_at: string;
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

  // Map camelCase to snake_case if needed (backend inconsistency)
  // Backend returns camelCase from Prisma, but frontend expects snake_case
  return {
    ...data,
    id: data.id,
    title: data.title || null, // Preserve title (can be null for old deals)
    buyer_wallet: data.buyer_wallet || data.buyerWallet || null,
    seller_wallet: data.seller_wallet || data.sellerWallet || null,
    deliver_deadline: data.deliver_deadline || data.deliverDeadline || null,
    price_usd: data.price_usd || (data.priceUsd ? data.priceUsd.toString() : "0"),
    status: data.status,
    created_at: data.created_at || (data.createdAt ? data.createdAt.toISOString() : new Date().toISOString()),
    updated_at: data.updated_at || (data.updatedAt ? data.updatedAt.toISOString() : new Date().toISOString()),
    onchain_events: data.onchain_events || data.onchainEvents || [],
    description: data.description,
    transaction_hash: data.transaction_hash || data.transactionHash,
    ai_resolution: data.ai_resolution || data.aiResolution,
  };
}

async function fetchRecentEvents(wallet: string, limit: number): Promise<DealEventRow[]> {
  const response = await fetch(`${ACTIONS_BASE_URL}/api/deals/events/recent?wallet_address=${wallet}&limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.status}`);
  }

  return await response.json();
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
  });
}

export function useDeal(dealId?: string) {
  return useQuery({
    queryKey: ["deal", dealId],
    queryFn: () => fetchDealById(dealId!),
    enabled: Boolean(dealId),
  });
}

export function useRecentDealEvents(limit = 10) {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? null;
  return useQuery({
    queryKey: ["deal-events", wallet, limit],
    queryFn: () => fetchRecentEvents(wallet!, limit),
    enabled: Boolean(wallet),
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
