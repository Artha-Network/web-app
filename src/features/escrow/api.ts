/**
 * Escrow API client (UI-facing only)
 *
 * Export function signatures and shared types used by pages/components.
 * Do NOT include backend logic — actual transaction building/execution
 * lives in actions-server / onchain-escrow or other backend services.
 */
import type { EscrowInit } from "@/types/escrow";

export interface CreateEscrowResponse {
  dealId: string;
}

/**
 * Create a new escrow draft (delegates to Actions Server in real impl).
 * This stub intentionally throws to enforce separation of concerns.
 */
export async function createEscrow(_input: EscrowInit): Promise<CreateEscrowResponse> {
  throw new Error("Not implemented in web-app. Use actions-server.");
}

