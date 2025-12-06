import { FC } from "react";
import DealCard, { DealCardProps } from "@/components/molecules/DealCard";

export interface ActiveDealsGridProps {
  readonly deals: ReadonlyArray<DealCardProps & { id: string; onchainAddress?: string }>;
  readonly onDelete?: (id: string) => void;
}

/**
 * ActiveDealsGrid
 * Responsive grid that renders DealCard items.
 */
export const ActiveDealsGrid: FC<ActiveDealsGridProps> = ({ deals, onDelete }) => {
  return (
    <div className="px-4 py-3 @container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {deals.map((deal) => (
        <DealCard key={deal.id} dealId={deal.onchainAddress || deal.id} {...deal} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default ActiveDealsGrid;

