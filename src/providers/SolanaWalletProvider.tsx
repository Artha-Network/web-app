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
    try {
      const phantom = new PhantomWalletAdapter();
      const solflare = new SolflareWalletAdapter();
      // Only keep wallets that are at least loadable or installed to avoid readyState loops
      return [phantom, solflare].filter(
        (w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable
      );
    } catch (error) {
      console.warn("Wallet adapter init failed; disabling wallets this render", error);
      return [];
    }
  }, [isBrowser]);

  // Enable autoConnect in browser environments
  // The wallet adapter will automatically reconnect to the last connected wallet from browser storage
  // This provides a seamless experience on page refresh
  // If no wallet was previously connected, it simply won't connect (safe behavior)
  const shouldAutoConnect = isBrowser;

  console.log("🔌 SolanaWalletProvider using endpoint:", endpoint, "Cluster:", cluster, "Wallets:", wallets.map(w => w.name), "AutoConnect:", shouldAutoConnect);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        // Enable autoConnect to allow wallet to reconnect from browser storage on page refresh
        // This provides seamless UX - if user was connected before, they stay connected
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

