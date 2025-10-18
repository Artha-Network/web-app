import { FC } from "react";

export interface SummaryCardProps {
  readonly buyerLabel: string;
  readonly sellerLabel: string;
  readonly totalValueText: string; // e.g., "1,005.00 USDC"
  readonly deadlineText: string; // e.g., "2024-08-15 23:59"
}

/**
 * SummaryCard
 * Right column summary box used in Step 2.
 */
export const SummaryCard: FC<SummaryCardProps> = ({
  buyerLabel,
  sellerLabel,
  totalValueText,
  deadlineText,
}) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-6 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Summary</h3>
      <div className="mt-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Buyer</span>
          <span className="font-mono text-gray-800 dark:text-gray-200">{buyerLabel}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Seller</span>
          <span className="font-mono text-gray-800 dark:text-gray-200">{sellerLabel}</span>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 my-3" />
        <div className="flex justify-between font-medium">
          <span className="text-gray-900 dark:text-gray-100">Total Escrow Value</span>
          <span className="text-gray-900 dark:text-gray-100">{totalValueText}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Deadline</span>
          <span>{deadlineText}</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;

