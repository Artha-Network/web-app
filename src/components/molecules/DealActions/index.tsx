import { FC } from "react";
import { Button } from "@/components/ui/button";

export interface DealActionsProps {
  readonly onCreateEscrow?: () => void;
}

/**
 * DealActions
 * Action button for creating an escrow.
 */
export const DealActions: FC<DealActionsProps> = ({
  onCreateEscrow,
}) => {
  return (
    <div className="flex justify-stretch">
      <div className="flex flex-1 gap-3 flex-wrap px-4 py-3 justify-start">
        <Button
          aria-label="Create Escrow"
          onClick={onCreateEscrow}
          className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-10 px-4 bg-blue-600 text-white text-sm font-semibold leading-normal tracking-[0.015em] shadow-sm transition-transform duration-300 hover:bg-blue-700"
        >
          <span className="truncate">Create Escrow</span>
        </Button>
      </div>
    </div>
  );
};

export default DealActions;

