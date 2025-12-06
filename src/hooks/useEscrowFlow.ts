import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export type FundingMethod = "Wallet" | "Sponsored" | "Manual Transfer";

export interface EscrowFlowData {
  title: string;
  role: "buyer" | "seller";
  counterpartyAddress: string;
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

const STORAGE_KEY = "artha:escrow-flow";

const defaultData: EscrowFlowData = {
  title: "",
  role: "buyer",
  counterpartyAddress: "",
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

  // Load from storage on mount (non-blocking)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setData(prev => ({ ...prev, ...JSON.parse(raw) }));
      }
    } catch {
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
