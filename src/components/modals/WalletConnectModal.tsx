import React from "react";
import { X } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

/**
 * WalletConnectModal
 * Minimal, reusable wallet connection modal that integrates with
 * @solana/wallet-adapter-react. Opens over a blurred, dimmed backdrop.
 */
export interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const btnBase =
  "w-full flex items-center justify-center gap-3 bg-white/80 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 border border-gray-300 dark:border-gray-700 p-3 rounded-xl font-medium transition-all duration-300 transform hover:-translate-y-0.5 text-gray-800 dark:text-gray-100";

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ open, onOpenChange }) => {
  const { connect, select, publicKey } = useWallet();
  const navigate = useNavigate();

  if (!open) return null;

  const handleConnect = async (provider: "phantom" | "solflare" | "other") => {
    const name = provider === "phantom" ? "Phantom" : provider === "solflare" ? "Solflare" : undefined;
    if (name) select(name);
    try {
      await connect();
      const address = publicKey?.toBase58();
      console.log("Wallet connected:", address);
      if (address) {
        const { error } = await supabase
          .from("users")
          .upsert({ wallet_address: address })
          .select();
        if (error) {
          console.error("Supabase upsert error:", error.message);
        }
      }
      onOpenChange(false);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      console.error("Wallet connect failed", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white/90 dark:bg-gray-900/90 border border-gray-300 dark:border-gray-700 w-[380px] max-w-full m-4 p-8 rounded-2xl shadow-md">
        <button
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-5 h-5" />
        </button>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Connect Wallet</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Please connect a wallet to continue.</p>
        </div>

        <div className="space-y-3">
          <button className={btnBase} onClick={() => void handleConnect("phantom")}>Connect Phantom</button>
          <button className={btnBase} onClick={() => void handleConnect("solflare")}>Connect Solflare</button>
          <button className={btnBase} onClick={() => void handleConnect("other")}>Other Wallets</button>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 mt-6 text-center">
          By connecting a wallet, you agree to Artha Network’s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default WalletConnectModal;
