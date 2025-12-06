/**
 * SolanaWalletProvider
 * Wraps the app with Solana wallet-adapter context providers.
 * Supports Phantom and Solflare. Reads RPC endpoint from Vite env `VITE_SOLANA_RPC`.
 */
import React from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { getConfiguredCluster } from "@/utils/solana";
import { clusterApiUrl } from "@solana/web3.js";

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

export const SolanaWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cluster = getConfiguredCluster();
  const defaultEndpoint = cluster === "localnet"
    ? "http://127.0.0.1:8899"
    : cluster === "devnet"
      ? "https://api.devnet.solana.com"
      : clusterApiUrl(cluster);

  const endpoint = (import.meta as any)?.env?.VITE_SOLANA_RPC ?? defaultEndpoint;
  console.log("🔌 SolanaWalletProvider using endpoint:", endpoint, "Cluster:", cluster);
  console.log("🔌 SolanaWalletProvider using endpoint:", endpoint);
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider;

