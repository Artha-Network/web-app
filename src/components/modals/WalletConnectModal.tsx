import React from "react";
import { X } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useNavigate } from "react-router-dom";
import { getConfiguredCluster, SolanaCluster } from "@/utils/solana";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { useAuth } from "@/context/AuthContext";

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

interface WalletIdentityResponse {
  userId: string;
  walletAddress: string;
  network: SolanaCluster;
  lastSeenAt?: string;
}

const USER_ID_STORAGE_KEY = "artha:user-id";

const persistUserIdentity = (payload: WalletIdentityResponse) => {
  try {
    localStorage.setItem(USER_ID_STORAGE_KEY, payload.userId);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("Unable to persist user identity", error);
  }
};

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ open, onOpenChange }) => {
  const { publicKey, connect, select, connected, wallet, wallets: providerWallets } = useWallet();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error: authError } = useAuth();
  
  // Use wallets from provider - these are the ones registered with WalletProvider
  // This ensures we're using the same adapter instances that the provider manages
  const wallets = React.useMemo(() => {
    if (providerWallets && providerWallets.length > 0) {
      console.log("Using wallets from provider:", providerWallets.map(w => w.adapter.name));
      return providerWallets;
    }
    // Fallback: create detection wallets if provider doesn't have them
    if (typeof window !== "undefined") {
      try {
        const phantom = new PhantomWalletAdapter();
        const solflare = new SolflareWalletAdapter();
        return [{ adapter: phantom }, { adapter: solflare }];
      } catch (error) {
        console.error("Failed to create fallback wallets:", error);
        return [];
      }
    }
    return [];
  }, [providerWallets]);
  
  const [walletReadyStates, setWalletReadyStates] = React.useState<Record<string, string>>({});

  // Update wallet ready states when wallets change
  React.useEffect(() => {
    if (!wallets || wallets.length === 0) return;

    try {
      // Check for extensions directly
      const hasPhantom = !!(window as any).solana?.isPhantom;
      const hasSolflare = !!(window as any).solflare;

      console.log("🔍 Extension detection:", {
        phantom: hasPhantom,
        solflare: hasSolflare,
        windowSolana: !!(window as any).solana,
        windowSolflare: !!(window as any).solflare,
      });

      // Force readyState update by accessing the property
      const updateReadyStates = () => {
        const states: Record<string, string> = {};
        wallets.forEach((w: any) => {
          const adapter = w.adapter || w;
          try {
            const state = adapter.readyState;
            states[adapter.name] = state;
            console.log(`Wallet ${adapter.name} readyState:`, state);
          } catch (e) {
            console.error(`Error checking ${adapter.name} readyState:`, e);
          }
        });
        setWalletReadyStates(states);
      };

      // Initial check
      updateReadyStates();

      // Poll for readyState changes (extensions might load asynchronously)
      const interval = setInterval(updateReadyStates, 500);
      
      // Also listen for wallet adapter events
      wallets.forEach((w: any) => {
        const adapter = w.adapter || w;
        adapter.on?.('readyStateChange', updateReadyStates);
      });

      return () => {
        clearInterval(interval);
        wallets.forEach((w: any) => {
          const adapter = w.adapter || w;
          adapter.off?.('readyStateChange', updateReadyStates);
        });
      };
    } catch (error) {
      console.error("Failed to update wallet states:", error);
    }
  }, [wallets]);

  // Handle successful connection - wait for authentication before navigating
  // AuthContext will automatically trigger login (message signing) when wallet connects
  React.useEffect(() => {
    let cancelled = false;

    async function handleConnectionSuccess() {
      if (!(open && connected && publicKey)) return;

        const address = publicKey.toBase58();
        console.log("Wallet connected:", address);

      // Wait for authentication to complete (message signing required)
      // AuthContext auto-triggers login when wallet connects, so we just wait for it
      if (isLoading) {
        // Still loading/authenticating, wait...
        return;
      }

      // Only navigate after authentication is complete
      if (isAuthenticated && !cancelled) {
        const network = getConfiguredCluster();
        try {
          const ACTIONS_BASE_URL = import.meta.env.VITE_ACTIONS_SERVER_URL || 'http://localhost:4000';
          const response = await fetch(`${ACTIONS_BASE_URL}/auth/upsert-wallet`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ walletAddress: address, network }),
          });

          if (!response.ok) {
            const message = await response.text();
            console.error("Wallet upsert failed:", message);
          } else {
            const payload = (await response.json()) as WalletIdentityResponse;
            if (!cancelled) {
            persistUserIdentity(payload);
            }
          }
        } catch (error) {
          if (!cancelled) console.error("Wallet upsert request failed", error);
        }

        if (!cancelled) {
        onOpenChange(false);
        navigate("/dashboard", { replace: true });
        }
      }
    }

    handleConnectionSuccess();

    return () => {
      cancelled = true;
    };
  }, [open, connected, publicKey, navigate, onOpenChange, isAuthenticated, isLoading]);

  const handleConnect = async (provider: "phantom" | "solflare" | "other") => {
    try {
      console.log("Attempting to connect wallet:", provider);
      console.log("Available wallets:", wallets?.map(w => ({ name: w.adapter.name, readyState: w.adapter.readyState })) || "none");
      
      // Direct check for browser extensions
      const hasPhantom = !!(window as any).solana?.isPhantom;
      const hasSolflare = !!(window as any).solflare;
      
      console.log("Direct extension check:", { hasPhantom, hasSolflare });

      // For "other", try to connect with the first available wallet
      if (provider === "other") {
        if (!wallets || wallets.length === 0) {
          alert("No wallets available. Please install Phantom or Solflare wallet extension.");
          return;
        }
        // Try connecting with the first available wallet
        const firstWallet = wallets[0];
        const firstAdapter = firstWallet.adapter;
        
        // Check if wallet is ready
        if (firstAdapter.readyState === WalletReadyState.NotDetected) {
          alert("No wallet detected. Please install a wallet extension and refresh the page.");
          return;
        }
        
        console.log(`Connecting to first available wallet: ${firstAdapter.name}`);
        select(firstAdapter.name);
        await new Promise(resolve => setTimeout(resolve, 300));
        await connect();
        return;
      }

      // Find the target wallet adapter
      const targetWallet = wallets?.find(w =>
        w.adapter.name.toLowerCase().includes(provider)
      );

      if (!targetWallet) {
        console.error(`${provider} wallet not found. Available wallets:`, wallets?.map(w => w.adapter.name) || []);
        
        // Check if extension exists but adapter not found
        // This shouldn't normally happen, but if it does, refresh the page
        if ((provider === "phantom" && hasPhantom) || (provider === "solflare" && hasSolflare)) {
          console.warn(`${provider} extension detected but adapter not found - page refresh may be needed`);
          alert(`${provider} extension is installed but not detected by the app. Please refresh the page and try again.`);
          return;
        }
        
        alert(`The ${provider} wallet is not available. Please make sure you have it installed and refresh the page.`);
        return;
      }

      // Get adapter and wallet name
      const adapter = targetWallet.adapter;
      const walletName = adapter.name;
      
      // Force readyState check
      let readyState = adapter.readyState;
      console.log(`${provider} wallet ready state (initial):`, readyState);

      // If not detected, try direct extension check
      if (readyState === WalletReadyState.NotDetected) {
        if (provider === "phantom" && hasPhantom) {
          console.log("Extension detected but adapter reports NotDetected - forcing connection attempt");
          readyState = WalletReadyState.Installed; // Override to allow connection attempt
        } else if (provider === "solflare" && hasSolflare) {
          console.log("Extension detected but adapter reports NotDetected - forcing connection attempt");
          readyState = WalletReadyState.Installed; // Override to allow connection attempt
        } else {
          const installUrl = provider === "phantom" 
            ? "https://phantom.app/" 
            : "https://solflare.com/";
          alert(`Please install the ${provider} wallet extension first.\n\nInstall at: ${installUrl}`);
          return;
        }
      }

      // Select the wallet adapter first - this is required before connecting
      console.log(`Selecting wallet: ${walletName}`);
      select(walletName);
      
      // Wait for the selection to propagate through the WalletProvider context
      // This is critical - the wallet must be selected in the provider before connecting
      await new Promise(resolve => setTimeout(resolve, 200));

      // Verify wallet is selected
      if (wallet?.adapter?.name !== adapter.name) {
        console.warn("Wallet selection may not have propagated, retrying...");
        select(walletName);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Wait for wallet adapter to be ready
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        const currentState = adapter.readyState;
        console.log(`Waiting for wallet ready... Attempt ${attempts + 1}, state: ${currentState}`);
        
        if (currentState === WalletReadyState.Installed || currentState === WalletReadyState.Loadable) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      // Additional wait for adapter to fully initialize after selection
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log("Attempting wallet connection...");
      console.log("Adapter details:", {
        name: adapter.name,
        readyState: adapter.readyState,
        selectedWallet: wallet?.adapter?.name,
        publicKey: adapter.publicKey?.toBase58(),
      });

      // Use the useWallet hook's connect() method - this is the proper way
      // It ensures the connection goes through the WalletProvider context
      // which properly triggers the browser extension popup
      console.log("Calling connect() from useWallet hook...");
      await connect();
      console.log("Wallet connection initiated successfully");
      
    } catch (error: any) {
      console.error("Wallet connect failed:", error);
      console.error("Error details:", {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      });
      
      // Provide more specific error messages
      let errorMessage = "Failed to connect wallet. Please make sure your wallet is installed and try again.";
      
      if (error?.name === "WalletNotReadyError") {
        errorMessage = `Wallet is not ready. Please make sure the ${provider} extension is installed and unlocked in your browser.`;
      } else if (error?.name === "WalletNotInstalledError") {
        const installUrl = provider === "phantom" 
          ? "https://phantom.app/" 
          : "https://solflare.com/";
        errorMessage = `Please install the ${provider} wallet extension first.\n\nInstall at: ${installUrl}`;
      } else if (error?.message?.includes("User rejected") || error?.message?.includes("User cancelled")) {
        errorMessage = "Connection cancelled. Please try again when ready.";
      } else if (error?.message) {
        errorMessage = `Connection failed: ${error.message}`;
      }
      
      // Show user-friendly error message
      alert(errorMessage);
    }
  };

  if (!open) return null;

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
            disabled={!wallets.find(w => w.adapter.name.toLowerCase().includes("phantom"))}
          >
            Connect Phantom
            {!(window as any).solana?.isPhantom && (
              <span className="text-xs text-orange-600 ml-2">(Extension not detected)</span>
            )}
          </button>
          <button 
            className={btnBase} 
            onClick={() => void handleConnect("solflare")}
            disabled={!wallets.find(w => w.adapter.name.toLowerCase().includes("solflare"))}
          >
            Connect Solflare
            {!(window as any).solflare && (
              <span className="text-xs text-orange-600 ml-2">(Extension not detected)</span>
            )}
          </button>
          <button className={btnBase} onClick={() => void handleConnect("other")}>Other Wallets</button>
        </div>
        
        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            <p className="font-semibold mb-1">Debug Info:</p>
            <p>Phantom: {(window as any).solana?.isPhantom ? '✅ Detected' : '❌ Not found'}</p>
            <p>Solflare: {(window as any).solflare ? '✅ Detected' : '❌ Not found'}</p>
            <p>Wallets loaded: {wallets.length}</p>
            {wallets.map(w => (
              <p key={w.adapter.name}>
                {w.adapter.name}: {walletReadyStates[w.adapter.name] || w.adapter.readyState}
              </p>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-600 dark:text-gray-400 mt-6 text-center">
          By connecting a wallet, you agree to Artha Network’s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default WalletConnectModal;
