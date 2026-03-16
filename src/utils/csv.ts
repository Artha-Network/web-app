import type { DealRow } from "@/hooks/useDeals";

export function exportDealsToCSV(deals: DealRow[], viewerWallet: string): void {
  const headers = ["Date", "Title", "Counterparty", "Amount (USDC)", "Status"];

  const rows = deals.map((deal) => {
    const counterparty =
      deal.buyer_wallet === viewerWallet
        ? deal.seller_wallet ?? ""
        : deal.buyer_wallet ?? "";

    return [
      new Date(deal.created_at).toLocaleDateString(),
      (deal.title ?? `Deal ${deal.id.slice(0, 8)}`).replace(/,/g, " "),
      counterparty,
      Number(deal.price_usd ?? 0).toFixed(2),
      deal.status,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `artha-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
