import React from "react";
import type { DealWithEvents, ResolutionData } from "@/hooks/useDeals";
import { formatDateTime, formatUsd, shortAddress } from "@/utils/format";

interface DealReceiptProps {
  deal: DealWithEvents;
  resolution?: ResolutionData | null;
}

const DealReceipt: React.FC<DealReceiptProps> = ({ deal, resolution }) => {
  const outcomeLabel =
    deal.status === "RELEASED"
      ? "Funds Released to Seller"
      : deal.status === "REFUNDED"
        ? "Funds Refunded to Buyer"
        : deal.status;

  return (
    <div className="print-receipt bg-white text-black p-8 max-w-2xl mx-auto font-sans">
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Artha Network</h1>
        <p className="text-sm text-gray-600 mt-1">Decentralized Escrow Receipt</p>
      </div>

      {/* Receipt Title */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-semibold">{deal.title || "Escrow Transaction"}</h2>
        <p className="text-sm text-gray-500 mt-1">Deal ID: {deal.id}</p>
      </div>

      {/* Status */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
        <p className="text-sm text-gray-600">Final Status</p>
        <p className="text-xl font-bold mt-1">{outcomeLabel}</p>
      </div>

      {/* Deal Details Table */}
      <table className="w-full mb-6 text-sm">
        <tbody>
          <tr className="border-b">
            <td className="py-2 font-medium text-gray-600 w-1/3">Amount</td>
            <td className="py-2 font-bold text-right">{formatUsd(deal.price_usd)} USDC</td>
          </tr>
          {deal.fee_bps != null && deal.fee_bps > 0 && (
            <tr className="border-b">
              <td className="py-2 font-medium text-gray-600">Platform Fee</td>
              <td className="py-2 text-right">{(deal.fee_bps / 100).toFixed(1)}%</td>
            </tr>
          )}
          <tr className="border-b">
            <td className="py-2 font-medium text-gray-600">Seller</td>
            <td className="py-2 text-right font-mono text-xs">
              {deal.seller_wallet ?? "—"}
              {deal.seller_profile?.display_name && (
                <span className="block text-gray-500 font-sans text-sm">{deal.seller_profile.display_name}</span>
              )}
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2 font-medium text-gray-600">Buyer</td>
            <td className="py-2 text-right font-mono text-xs">
              {deal.buyer_wallet ?? "—"}
              {deal.buyer?.display_name && (
                <span className="block text-gray-500 font-sans text-sm">{deal.buyer.display_name}</span>
              )}
            </td>
          </tr>
          <tr className="border-b">
            <td className="py-2 font-medium text-gray-600">Created</td>
            <td className="py-2 text-right">{formatDateTime(deal.created_at)}</td>
          </tr>
          {deal.funded_at && (
            <tr className="border-b">
              <td className="py-2 font-medium text-gray-600">Funded</td>
              <td className="py-2 text-right">{formatDateTime(deal.funded_at)}</td>
            </tr>
          )}
          <tr className="border-b">
            <td className="py-2 font-medium text-gray-600">Completed</td>
            <td className="py-2 text-right">{formatDateTime(deal.updated_at)}</td>
          </tr>
          {deal.onchain_address && (
            <tr className="border-b">
              <td className="py-2 font-medium text-gray-600">Escrow Address</td>
              <td className="py-2 text-right font-mono text-xs break-all">{deal.onchain_address}</td>
            </tr>
          )}
          {deal.vin && (
            <tr className="border-b">
              <td className="py-2 font-medium text-gray-600">Vehicle VIN</td>
              <td className="py-2 text-right font-mono">{deal.vin}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Resolution Details */}
      {resolution && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-sm uppercase text-gray-600">Arbitration Result</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-medium text-gray-600 w-1/3">Outcome</td>
                <td className="py-2 text-right font-bold">{resolution.outcome}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium text-gray-600">Confidence</td>
                <td className="py-2 text-right">{(resolution.confidence * 100).toFixed(1)}%</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium text-gray-600">Source</td>
                <td className="py-2 text-right">{resolution.source}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium text-gray-600">Issued</td>
                <td className="py-2 text-right">{formatDateTime(resolution.issued_at)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Transaction Signatures */}
      {deal.onchain_events && deal.onchain_events.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-sm uppercase text-gray-600">On-Chain Transactions</h3>
          <div className="space-y-2">
            {deal.onchain_events.map((evt) => (
              <div key={evt.id} className="flex justify-between items-start text-xs border-b pb-2">
                <span className="font-semibold uppercase">{evt.instruction}</span>
                <span className="font-mono text-gray-500 text-right ml-4 break-all max-w-[60%]">
                  {evt.tx_sig}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-black pt-4 mt-6 text-center text-xs text-gray-500">
        <p>This receipt was generated by Artha Network — Solana Escrow Platform</p>
        <p className="mt-1">Verified on Solana Devnet | {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default DealReceipt;
