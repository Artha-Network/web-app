/**
 * SolanaWalletProvider
 * Wraps the app with Solana wallet-adapter context providers.
 * Supports Phantom and Solflare. Reads RPC endpoint from Vite env `VITE_SOLANA_RPC`.
 */
import React, { useMemo, useEffect, useState } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { getConfiguredCluster } from "@/utils/solana";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { API_BASE } from "@/lib/config";

// Create wallets outside component to persist them
const getWallets = () => {
  if (typeof window === "undefined") return [];
  try {
    const phantom = new PhantomWalletAdapter();
    const solflare = new SolflareWalletAdapter();
    return [phantom, solflare];
  } catch (error) {
    console.warn("Wallet adapter init failed", error);
    return [];
  }
};

export const SolanaWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isBrowser = typeof window !== "undefined";

  const cluster = getConfiguredCluster();
  const defaultEndpoint = cluster === "localnet"
    ? "http://127.0.0.1:8899"
    : cluster === "devnet"
      ? "https://api.devnet.solana.com"
      : cluster === "testnet"
        ? "https://api.testnet.solana.com"
        : clusterApiUrl("mainnet-beta");

  const endpoint = (import.meta as any)?.env?.VITE_SOLANA_RPC ?? defaultEndpoint;

  const wallets = useMemo(() => {
    if (!isBrowser) return [];
    return getWallets();
  }, [isBrowser]);

  // Disable autoConnect - wallet should only connect when user explicitly clicks "Connect Wallet"
  // This prevents the wallet from being invoked automatically on page load
  const shouldAutoConnect = false;

  console.log("🔌 SolanaWalletProvider using endpoint:", endpoint, "Cluster:", cluster, "Wallets:", wallets.map(w => w.name), "AutoConnect:", shouldAutoConnect);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        // Disable autoConnect - user must explicitly click "Connect Wallet" and choose a wallet
        // This ensures wallet popup only appears when user intentionally initiates connection
        autoConnect={shouldAutoConnect}
        onError={(error) => {
          if (error?.name === "WalletNotReadyError") {
            console.warn("Wallet not ready; user likely needs to install/enable wallet", error);
            return;
          }
          console.error("Wallet provider error", error);
        }}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider;

