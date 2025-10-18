import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface ModalContextValue {
  walletModalOpen: boolean;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  setWalletModalOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextValue | undefined>(undefined);

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const openWalletModal = useCallback(() => setWalletModalOpen(true), []);
  const closeWalletModal = useCallback(() => setWalletModalOpen(false), []);

  const value = useMemo(
    () => ({ walletModalOpen, openWalletModal, closeWalletModal, setWalletModalOpen }),
    [walletModalOpen, openWalletModal, closeWalletModal]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export function useModalContext() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModalContext must be used within ModalProvider");
  return ctx;
}

