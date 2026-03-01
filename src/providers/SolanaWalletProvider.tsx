/**
 * SolanaWalletProvider
 * Wraps the app with Solana wallet-adapter context providers.
 * Supports Phantom and Solflare. Reads RPC endpoint from Vite env `VITE_SOLANA_RPC`.
 */
import React, { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { getConfiguredCluster } from "@/utils/solana";
import { clusterApiUrl } from "@solana/web3.js";

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

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={false}
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

