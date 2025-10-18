import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface WalletContextValue {
  address?: string;
  isConnected: boolean;
  connect: (address: string) => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

const STORAGE_KEY = "artha:wallet-address";

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | undefined>(undefined);

  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) setAddress(cached);
    } catch {
      // ignore storage errors
    }
  }, []);

  const connect = useCallback((addr: string) => {
    setAddress(addr);
    try {
      localStorage.setItem(STORAGE_KEY, addr);
    } catch {
      // ignore storage errors
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(undefined);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({ address, isConnected: Boolean(address), connect, disconnect }),
    [address, connect, disconnect]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used within WalletProvider");
  return ctx;
}

