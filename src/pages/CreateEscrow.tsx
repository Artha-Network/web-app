import React from "react";
import { CreateEscrowForm } from "@/components/organisms/create-escrow-form";
import type { EscrowInit } from "@/types/escrow";
import { toast } from "@/components/ui/sonner";

const CreateEscrowPage: React.FC = () => {
  const handleSubmit = async (values: EscrowInit) => {
    console.debug("Escrow draft:", values);
    toast.success("Escrow draft prepared (stub)");
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Create Escrow</h1>
        <p className="text-muted-foreground">Define your escrow details before funding on Solana.</p>
      </div>
      <CreateEscrowForm onSubmit={handleSubmit} />
    </div>
  );
};

export default CreateEscrowPage;

