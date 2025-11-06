/**
 * SolanaWalletProvider
 * Wraps the app with Solana wallet-adapter context providers.
 * Supports Phantom and Solflare. Reads RPC endpoint from Vite env `VITE_SOLANA_RPC`.
 */
import React from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

export const SolanaWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const endpoint = (import.meta as any)?.env?.VITE_SOLANA_RPC ?? "http://127.0.0.1:8899";
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider;

