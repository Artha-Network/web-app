import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

export type FundingMethod = "Wallet" | "Sponsored" | "Manual Transfer";

export interface EscrowFlowData {
  title: string;
  role: "buyer" | "seller";
  counterpartyAddress: string;
  counterpartyEmail?: string;
  userEmail?: string;
  amount: number | "";
  description: string;
  initiatorDeadline: string; // ISO string
  completionDeadline: string; // ISO string
  fundingMethod: FundingMethod;
  deliveryDeadline: string; // ISO string
  disputeWindowDays: number | "";
  contract?: string;
  questions?: string[];
}

// Zod schema for runtime validation
const EscrowFlowSchema = z.object({
  title: z.string().optional().default(""),
  role: z.enum(["buyer", "seller"]).default("buyer"),
  counterpartyAddress: z.string().optional().default(""),
  amount: z.union([z.number(), z.literal(""), z.string()]).transform(val => val === "" ? "" : Number(val)),
  description: z.string().optional().default(""),
  initiatorDeadline: z.string().optional().default(""),
  completionDeadline: z.string().optional().default(""),
  fundingMethod: z.enum(["Wallet", "Sponsored", "Manual Transfer"]).default("Wallet"),
  deliveryDeadline: z.string().optional().default(""),
  disputeWindowDays: z.union([z.number(), z.literal("")]).optional().default(""),
  contract: z.string().optional(),
  questions: z.array(z.string()).optional(),
});

const STORAGE_KEY = "artha:escrow-flow";

const defaultData: EscrowFlowData = {
  title: "",
  role: "buyer",
  counterpartyAddress: "",
  counterpartyEmail: "",
  userEmail: "",
  amount: "",
  description: "",
  initiatorDeadline: "",
  completionDeadline: "",
  fundingMethod: "Wallet",
  deliveryDeadline: "",
  disputeWindowDays: "",
  contract: "",
  questions: [],
};

export function useEscrowFlow() {
  const navigate = useNavigate();
  const [data, setData] = useState<EscrowFlowData>(defaultData);

  // Load from storage on mount (non-blocking) with Schema Validation
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const result = EscrowFlowSchema.safeParse(parsed);
        if (result.success) {
          // Merge validated data, ensuring types match EscrowFlowData
          // Note: transform in schema handles string->number conversion for amount if needed
          setData(prev => ({ ...prev, ...result.data } as EscrowFlowData));
        } else {
          console.warn("Escrow flow data validation failed, resetting storage", result.error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.error("Failed to load escrow flow data", e);
      // ignore storage errors
    }
  }, []);

  // Save to storage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage errors
    }
  }, [data]);

  const setField = useCallback(<K extends keyof EscrowFlowData>(key: K, value: EscrowFlowData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateData = useCallback((updates: Partial<EscrowFlowData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setData(defaultData);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  const fee = useMemo(() => {
    const amt = typeof data.amount === "number" ? data.amount : 0;
    return Number(((amt * 0.005) || 0).toFixed(2));
  }, [data.amount]);

  const total = useMemo(() => {
    const amt = typeof data.amount === "number" ? data.amount : 0;
    return Number((amt + fee).toFixed(2));
  }, [data.amount, fee]);

  const goTo = useCallback((step: 1 | 2 | 3) => navigate(`/escrow/step${step}`), [navigate]);
  const next = useCallback((current: 1 | 2) => goTo((current + 1) as 2 | 3), [goTo]);
  const back = useCallback((current: 2 | 3) => goTo((current - 1) as 1 | 2), [goTo]);

  return { data, setData, setField, updateData, reset, fee, total, goTo, next, back } as const;
}
