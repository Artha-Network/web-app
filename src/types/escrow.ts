// Shared, UI-facing escrow types. No business logic here.
export type EscrowCurrency = "USDC";

export interface EscrowInitFormValues {
  title: string;
  amount: number;
  currency: EscrowCurrency;
  counterpartyAddress: string;
  feeBps: number;
  dueDate: Date | null;
  description?: string;
}

export interface EscrowInit extends Omit<EscrowInitFormValues, "dueDate"> {
  dueDateUnix: number | null;
}
