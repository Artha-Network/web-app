import React from "react";
import { CreateEscrowForm } from "@/components/organisms/create-escrow-form";
import type { EscrowInit } from "@/types/escrow";

export interface EscrowFlowProps {
  onCreate?: (payload: EscrowInit) => void | Promise<void>;
}

export const EscrowFlow: React.FC<EscrowFlowProps> = ({ onCreate }) => {
  return (
    <div className="space-y-6">
      <CreateEscrowForm onSubmit={onCreate} />
    </div>
  );
};

export default EscrowFlow;

