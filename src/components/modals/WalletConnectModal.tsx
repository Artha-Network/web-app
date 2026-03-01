import React, { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { toast } from "@/components/ui/sonner";
import { getConfiguredCluster, SolanaCluster } from "@/utils/solana";
import { useAuth } from "@/context/AuthContext";

export interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const btnBase =
  "w-full flex items-center justify-center gap-3 bg-white/80 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 border border-gray-300 dark:border-gray-700 p-3 rounded-xl font-medium transition-all duration-300 transform hover:-translate-y-0.5 text-gray-800 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

interface WalletIdentityResponse {
  userId: string;
  walletAddress: string;
  network: SolanaCluster;
  lastSeenAt?: string;
}

const USER_ID_STORAGE_KEY = "artha:user-id";

const INSTALL_URLS: Record<string, string> = {
  phantom: "https://phantom.app/",
  solflare: "https://solflare.com/",
};

function detectExtension(provider: string): boolean {
  if (provider === "phantom") return !!(window as any).solana?.isPhantom;
  if (provider === "solflare") return !!(window as any).solflare;
  return false;
}

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ open, onOpenChange }) => {
  const { publicKey, connect, select, connected, wallets: providerWallets } = useWallet();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error: authError } = useAuth();
  const [connecting, setConnecting] = useState(false);

  // Use provider-managed wallet adapters only — never create separate adapter instances
  const wallets = providerWallets ?? [];

  const findWallet = useCallback(
    (provider: string) => wallets.find(w => w.adapter.name.toLowerCase().includes(provider)),
    [wallets]
  );

  // Extension detection state (checked once on open + after a brief delay for late-loading extensions)
  const [extensionState, setExtensionState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    const check = () => {
      setExtensionState({
        phantom: detectExtension("phantom"),
        solflare: detectExtension("solflare"),
      });
    };
    check();
    // Extensions may inject after DOMContentLoaded — recheck once after 1s
    const timer = setTimeout(check, 1000);
    return () => clearTimeout(timer);
  }, [open]);

  // After authentication succeeds, upsert wallet and navigate to dashboard
  useEffect(() => {
    if (!(open && connected && publicKey && isAuthenticated && !isLoading)) return;
    let cancelled = false;

    (async () => {
      const address = publicKey.toBase58();
      const network = getConfiguredCluster();
      try {
        const baseUrl = import.meta.env.VITE_ACTIONS_SERVER_URL || "http://localhost:4000";
        const res = await fetch(`${baseUrl}/auth/upsert-wallet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: address, network }),
        });
        if (res.ok) {
          const payload = (await res.json()) as WalletIdentityResponse;
          if (!cancelled) {
            try { localStorage.setItem(USER_ID_STORAGE_KEY, payload.userId); } catch { /* noop */ }
          }
        }
      } catch (err) {
        if (!cancelled) console.error("Wallet upsert failed", err);
      }
      if (!cancelled) {
        onOpenChange(false);
        navigate("/dashboard", { replace: true });
      }
    })();

    return () => { cancelled = true; };
  }, [open, connected, publicKey, isAuthenticated, isLoading, navigate, onOpenChange]);

  const handleConnect = useCallback(async (provider: "phantom" | "solflare") => {
    setConnecting(true);
    try {
      const targetWallet = findWallet(provider);
      if (!targetWallet) {
        toast.error(`${provider} wallet adapter not available. Please refresh the page.`);
        return;
      }

      const adapter = targetWallet.adapter;
      const hasExtension = detectExtension(provider);

      // Check if extension is installed (adapter detection or direct window check)
      if (adapter.readyState === WalletReadyState.NotDetected && !hasExtension) {
        toast.error(`Please install the ${provider} wallet extension.`, {
          action: {
            label: "Install",
            onClick: () => window.open(INSTALL_URLS[provider], "_blank"),
          },
        });
        return;
      }

      // Select wallet in the provider context, then connect
      select(adapter.name);
      // Brief delay for the provider context to update after select()
      await new Promise(r => setTimeout(r, 200));
      await connect();
    } catch (error: any) {
      if (error?.message?.includes("User rejected") || error?.message?.includes("User cancelled")) {
        toast.info("Connection cancelled.");
      } else if (error?.name === "WalletNotReadyError") {
        toast.error(`${provider} is not ready. Make sure the extension is installed and unlocked.`);
      } else {
        toast.error(error?.message || "Failed to connect wallet.");
      }
    } finally {
      setConnecting(false);
    }
  }, [connect, select, findWallet]);

  if (!open) return null;

  const phantomDetected = extensionState.phantom;
  const solflareDetected = extensionState.solflare;

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
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {isLoading
              ? "Please sign the message in your wallet to verify ownership..."
              : connected && !isAuthenticated
              ? "Authentication required. Please sign the message."
              : "Please connect a wallet to continue."}
          </p>
          {authError && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">{authError}</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            className={btnBase}
            onClick={() => void handleConnect("phantom")}
            disabled={connecting || !findWallet("phantom")}
          >
            Connect Phantom
            {!phantomDetected && (
              <span className="text-xs text-orange-600 ml-2">(Not detected)</span>
            )}
          </button>

          <button
            className={btnBase}
            onClick={() => void handleConnect("solflare")}
            disabled={connecting || !findWallet("solflare")}
          >
            Connect Solflare
            {!solflareDetected && (
              <span className="text-xs text-orange-600 ml-2">(Not detected)</span>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 mt-6 text-center">
          By connecting a wallet, you agree to Artha Network's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default WalletConnectModal;
