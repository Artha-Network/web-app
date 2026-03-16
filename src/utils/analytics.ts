import { format, parseISO } from "date-fns";
import type { DealRow } from "@/hooks/useDeals";

export interface MonthlyVolume {
  month: string;
  count: number;
}

export interface StatusCount {
  status: string;
  count: number;
  fill: string;
}

export interface MonthlyValue {
  month: string;
  total: number;
}

export interface SummaryStats {
  totalDeals: number;
  totalValue: number;
  activeDeals: number;
  completedDeals: number;
  disputedDeals: number;
  successRate: number;
  avgDealValue: number;
}

const STATUS_COLORS: Record<string, string> = {
  INIT: "hsl(215, 15%, 60%)",
  FUNDED: "hsl(215, 85%, 55%)",
  DELIVERED: "hsl(260, 60%, 55%)",
  DISPUTED: "hsl(25, 85%, 55%)",
  RESOLVED: "hsl(280, 60%, 55%)",
  RELEASED: "hsl(140, 70%, 45%)",
  REFUNDED: "hsl(0, 70%, 55%)",
};

export function computeVolumeByMonth(deals: DealRow[]): MonthlyVolume[] {
  const map = new Map<string, number>();

  for (const deal of deals) {
    const month = format(parseISO(deal.created_at), "yyyy-MM");
    map.set(month, (map.get(month) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month: format(parseISO(`${month}-01`), "MMM yyyy"),
      count,
    }));
}

export function computeStatusBreakdown(deals: DealRow[]): StatusCount[] {
  const map = new Map<string, number>();

  for (const deal of deals) {
    map.set(deal.status, (map.get(deal.status) ?? 0) + 1);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([status, count]) => ({
      status,
      count,
      fill: STATUS_COLORS[status] ?? "hsl(215, 15%, 50%)",
    }));
}

export function computeValueTrend(deals: DealRow[]): MonthlyValue[] {
  const map = new Map<string, number>();

  for (const deal of deals) {
    const month = format(parseISO(deal.created_at), "yyyy-MM");
    const amount = Number(deal.price_usd ?? 0);
    map.set(month, (map.get(month) ?? 0) + amount);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({
      month: format(parseISO(`${month}-01`), "MMM yyyy"),
      total: Math.round(total * 100) / 100,
    }));
}

export function computeSummaryStats(deals: DealRow[]): SummaryStats {
  const totalDeals = deals.length;
  const totalValue = deals.reduce((sum, d) => sum + Number(d.price_usd ?? 0), 0);
  const activeDeals = deals.filter((d) =>
    ["INIT", "FUNDED", "DELIVERED", "DISPUTED"].includes(d.status)
  ).length;
  const completedDeals = deals.filter((d) =>
    ["RELEASED", "RESOLVED"].includes(d.status)
  ).length;
  const disputedDeals = deals.filter((d) =>
    ["DISPUTED", "RESOLVED", "REFUNDED"].includes(d.status)
  ).length;
  const terminalDeals = deals.filter((d) =>
    ["RELEASED", "RESOLVED", "REFUNDED"].includes(d.status)
  ).length;
  const successRate = terminalDeals > 0 ? (completedDeals / terminalDeals) * 100 : 0;
  const avgDealValue = totalDeals > 0 ? totalValue / totalDeals : 0;

  return {
    totalDeals,
    totalValue: Math.round(totalValue * 100) / 100,
    activeDeals,
    completedDeals,
    disputedDeals,
    successRate: Math.round(successRate * 10) / 10,
    avgDealValue: Math.round(avgDealValue * 100) / 100,
  };
}
