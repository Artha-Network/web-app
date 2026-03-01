import { FC, useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Banknote, Gavel, CheckCircle2, ArrowRightCircle, Repeat, RefreshCw, Wallet, Globe, DollarSign, AlertCircle } from "lucide-react";
import HeaderBar from "@/components/organisms/HeaderBar";
import DashboardGreeting from "@/components/organisms/DashboardGreeting";
import DealActions from "@/components/molecules/DealActions";
import ActiveDealsGrid from "@/components/organisms/ActiveDealsGrid";
import ReputationScoreCard from "@/components/molecules/ReputationScoreCard";
import NotificationsList from "@/components/organisms/NotificationsList";
import RecentActivityTimeline from "@/components/organisms/RecentActivityTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext"; // Use unified AuthContext
import { useModalContext } from "@/context/ModalContext";
import { useMyDeals, useRecentDealEvents, statusToBadge, useDeleteDeal } from "@/hooks/useDeals";
import { useEvent } from "@/hooks/useEvent";
import { getConfiguredCluster } from '@/utils/solana';
import type { DealCardProps } from "@/components/molecules/DealCard";
import WalletConnectModal from "@/components/modals/WalletConnectModal";

const INSTRUCTION_NOTIFICATION_MAP: Record<string, { icon: JSX.Element; colorClass: string }> = {
  FUND: { icon: <Banknote className="text-green-600 w-7 h-7" aria-hidden />, colorClass: "text-green-600" },
  RELEASE: { icon: <ArrowRightCircle className="text-blue-600 w-7 h-7" aria-hidden />, colorClass: "text-blue-600" },
  REFUND: { icon: <Repeat className="text-purple-600 w-7 h-7" aria-hidden />, colorClass: "text-purple-600" },
  OPEN_DISPUTE: { icon: <Gavel className="text-red-600 w-7 h-7" aria-hidden />, colorClass: "text-red-600" },
  RESOLVE: { icon: <CheckCircle2 className="text-amber-600 w-7 h-7" aria-hidden />, colorClass: "text-amber-600" },
};

const fallbackActivities = [
  {
    id: "placeholder-fund",
    icon: <CheckCircle2 />, // styled via colorClass
    title: "Funding events will appear after transactions confirm.",
    date: new Date().toLocaleDateString(),
    colorClass: "text-green-600",
  },
  {
    id: "placeholder-release",
    icon: <ArrowRightCircle />,
    title: "Release confirmations are tracked automatically.",
    date: new Date().toLocaleDateString(),
    colorClass: "text-blue-600",
  },
  {
    id: "placeholder-refund",
    icon: <Repeat />,
    title: "Refunds will be listed once executed.",
    date: new Date().toLocaleDateString(),
    colorClass: "text-purple-600",
  },
];

import { shortAddress } from "@/utils/format";

const Dashboard: FC = () => {
  const navigate = useNavigate();
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { connection } = useConnection();
  const { trackEvent } = useEvent();

  // Use unified AuthContext
  const { isAuthenticated, isLoading: isAuthLoading, user: authUser, error: authError, login: retryAuth } = useAuth();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [cluster] = useState(getConfiguredCluster());
  const [debugInfo, setDebugInfo] = useState<{
    rpcEndpoint: string;
    walletAddress: string;
    balanceSource: string;
  } | null>(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const address = publicKey?.toBase58();
  // Use display name from profile (set during profile creation), fallback to name, then "User"
  const userName = authUser?.displayName || authUser?.name || "User";

  // Check if wallet connection is required but missing
  const needsWalletConnection = isAuthenticated && !connected && !publicKey;
  
  // Get modal context for opening wallet modal
  const { openWalletModal } = useModalContext();

  // Track wallet connection events
  useEffect(() => {
    if (connected && publicKey) {
      trackEvent('wallet_connected', {
        wallet_type: wallet?.adapter?.name,
        network: cluster,
        wallet_address: publicKey.toString()
      });
    }
  }, [connected, publicKey, wallet, cluster, trackEvent]);

  // Detect auth/wallet mismatch and prompt user to reconnect
  useEffect(() => {
    if (isAuthenticated && !connected && !isAuthLoading) {
      // User has a valid backend session but wallet is disconnected
      setShowConnectModal(true);
    }
  }, [isAuthenticated, connected, isAuthLoading]);

  // Fetch wallet balances
  const fetchWalletData = async () => {
    if (!publicKey || !connected) return;

    setIsBalanceLoading(true);
    try {
      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey);
      setSolBalance(solBalance / LAMPORTS_PER_SOL);

      // Store debug info
      setDebugInfo({
        rpcEndpoint: connection.rpcEndpoint,
        walletAddress: publicKey.toBase58(),
        balanceSource: `Fetched from RPC: ${connection.rpcEndpoint}`,
      });

    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [publicKey, connected, connection]);

  const handleRefresh = () => {
    trackEvent('wallet_refresh', { wallet_address: publicKey?.toString() });
    fetchWalletData();
  };

  const handleDisconnect = () => {
    trackEvent('wallet_disconnected', { wallet_address: publicKey?.toString() });
    disconnect();
  };

  const deleteDeal = useDeleteDeal();

  const handleDeleteDeal = async (dealId: string) => {
    if (confirm("Are you sure you want to delete this deal? This action cannot be undone.")) {
      trackEvent('deal_delete_click', { deal_id: dealId });
      try {
        await deleteDeal.mutateAsync(dealId);
        // Toast or notification could go here
      } catch (error) {
        console.error("Failed to delete deal:", error);
        alert("Failed to delete deal. Please try again.");
      }
    }
  };

  const { data: dealsData } = useMyDeals();
  const { data: eventsData } = useRecentDealEvents(6);

  const dealCards: ReadonlyArray<DealCardProps & { id: string }> = useMemo(() => {
    if (!address || !dealsData) return [];
    return dealsData.deals.map((deal) => {
      const counterparty = deal.buyer_wallet === address ? deal.seller_wallet : deal.buyer_wallet;
      const deadline = deal.deliver_deadline ? new Date(deal.deliver_deadline).toLocaleDateString() : "—";
      const dealId = deal.id ?? "";
      // Use title if available, otherwise fallback to deal ID
      const displayTitle = deal.title && deal.title.trim()
        ? deal.title.trim()
        : (dealId ? `Deal ${dealId.slice(0, 8)}...` : "Untitled Deal");
      return {
        id: deal.id,
        title: displayTitle,
        counterparty: shortAddress(counterparty),
        amountUsd: Number(deal.price_usd ?? 0),
        deadline,
        status: statusToBadge(deal.status) as DealCardProps["status"],
      };
    });
  }, [address, dealsData]);

  const notifications = useMemo(() => {
    if (!eventsData || !eventsData.length) {
      return [{
        id: "no-activity",
        icon: <Wallet className="text-blue-600 w-7 h-7" aria-hidden />,
        title: "No recent activity",
        date: new Date().toLocaleDateString(),
      }];
    }
    return eventsData.slice(0, 5).map((evt) => {
      const instruction = (evt.instruction || "unknown").toUpperCase();
      const mapping = INSTRUCTION_NOTIFICATION_MAP[instruction] || {
        icon: <CheckCircle2 className="text-gray-600 w-7 h-7" aria-hidden />,
        colorClass: "text-gray-600",
      };
      const txSig = evt.tx_sig ?? "";
      return {
        id: evt.id,
        icon: mapping.icon,
        title: `${instruction} confirmed (${txSig.slice(0, 6)}…)`,
        date: evt.created_at ? new Date(evt.created_at).toLocaleString() : "",
      };
    });
  }, [eventsData]);

  const recentActivities = useMemo(() => {
    if (!eventsData || !eventsData.length) return fallbackActivities;
    return eventsData.map((evt) => {
      const instruction = (evt.instruction || "unknown").toUpperCase();
      const icon = instruction === "FUND" ? <CheckCircle2 /> : instruction === "RELEASE" ? <ArrowRightCircle /> : <Repeat />;
      const colorClass = instruction === "FUND" ? "text-green-600" : instruction === "RELEASE" ? "text-blue-600" : "text-purple-600";
      const txSig = evt.tx_sig ?? "";
      return {
        id: evt.id,
        icon,
        title: `${instruction} confirmed (${txSig.slice(0, 6)}…)`,
        date: evt.created_at ? new Date(evt.created_at).toLocaleString() : "",
        colorClass,
      };
    });
  }, [eventsData]);

  return (
    <div
      className="relative flex h-auto min-h-screen w-full flex-col bg-white group/design-root overflow-x-hidden"
      style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
    >
      <div className="layout-container flex h-full grow flex-col">
        <HeaderBar
          userName={userName}
          avatarUrl="https://lh3.googleusercontent.com/aida-public/AB6AXuAPp2y2Cah7z1UIbc18diVtfZ0q9F-TnVTK9Lvk5mOT7PdzYTfFh3EMkRB9-tVlgcKZaSE31AcQ8amNjJ1U4WJ4mqapt_s_qGDjvnMrcxbLXQAKaekEr2g11mX5hO3yesWvtsYReBCSvFZJjDJ_-L9p0z8YspicW5HtP0zDRXFKKmGoRioxwlpZ5MHgCy4nS2NSdOCb397BT3WuH6qDrJ_Wvj3KUSwT_9yNsGFv9H_w38WJt0QP3E6-H06eTnZFn-MXLyAELbjWxHzD"
        />

        <main className="gap-1 px-6 flex flex-1 justify-center py-5 bg-gray-50">
          <div className="layout-content-container flex flex-col max-w-[920px] flex-1">
            <DashboardGreeting name={userName} />

            {/* Wallet Status Card */}
            <Card className="mx-4 mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Wallet Status
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {connected && publicKey ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRefresh}
                          disabled={isBalanceLoading}
                        >
                          <RefreshCw className={`w-4 h-4 mr-2 ${isBalanceLoading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDisconnect}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={openWalletModal}
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Connect Wallet
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!connected || !publicKey ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
                    <p className="text-muted-foreground mb-4">
                      Please connect your wallet to view your balance and manage deals.
                    </p>
                    <Button onClick={openWalletModal} size="lg">
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Wallet</label>
                        <p className="font-semibold">{wallet?.adapter?.name || 'Unknown'}</p>
                      </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Network</label>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                      <Globe className="w-3 h-3 mr-1" />
                      {cluster.charAt(0).toUpperCase() + cluster.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">SOL Balance</label>
                    <div className="flex items-center gap-2">
                      {isBalanceLoading ? (
                        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                      ) : (
                        <span className="font-semibold">
                          {solBalance?.toFixed(4) || '0.0000'} SOL
                        </span>
                      )}
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {solBalance !== null && solBalance < 0.01 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        ⚠️ Low balance - you may need SOL for fees
                      </p>
                    )}
                  </div>
                </div>

                {/* Wallet Verification Status */}
                <div className="mt-4 pt-4 border-t">
                  {isAuthLoading ? (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying wallet ownership...</span>
                    </div>
                  ) : isAuthenticated ? (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Wallet verified and authenticated</span>
                      {authUser?.id && (
                        <Badge variant="secondary" className="ml-2">User ID: {authUser.id.slice(0, 8)}</Badge>
                      )}
                    </div>
                  ) : authError ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <span>⚠️ {authError}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryAuth}
                        className="w-fit"
                      >
                        Retry Verification
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <span>⚠️ Wallet connected but not authenticated</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryAuth}
                        className="w-fit"
                      >
                        Verify Now
                      </Button>
                    </div>
                  )}
                </div>

                {/* Debug Info Panel */}
                {debugInfo && (
                  <div className="mt-4 pt-4 border-t bg-blue-50 dark:bg-blue-950 p-3 rounded-md">
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2">🔍 Debug Information</p>
                    <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
                      <div className="flex justify-between">
                        <span className="font-medium">RPC Endpoint:</span>
                        <span className="font-mono">{debugInfo.rpcEndpoint}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Wallet Address:</span>
                        <span className="font-mono">{debugInfo.walletAddress.slice(0, 8)}...{debugInfo.walletAddress.slice(-6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Balance Source:</span>
                        <span className="font-mono text-[10px]">{debugInfo.balanceSource}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Configured Cluster:</span>
                        <span className="font-mono">{cluster}</span>
                      </div>
                    </div>
                  </div>
                )}
                  </>
                )}
              </CardContent>
            </Card>

            <DealActions onCreateEscrow={() => navigate("/escrow/step1")} />

            <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Your Active Deals
            </h2>
            {dealCards.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">No deals found for this wallet yet.</div>
            ) : (
              <ActiveDealsGrid deals={dealCards} onDelete={handleDeleteDeal} />
            )}
          </div>

          <aside className="layout-content-container flex flex-col w-[360px] gap-4">
            <ReputationScoreCard score={authUser?.reputationScore ?? 0} />

            <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Notifications
            </h2>
            <NotificationsList items={notifications} />

            <h2 className="text-gray-900 text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">
              Recent Activity
            </h2>
            <RecentActivityTimeline items={recentActivities} />
          </aside>
        </main>
      </div>

      {/* Wallet Connect Modal - shown when authenticated but wallet disconnected */}
      <WalletConnectModal
        open={showConnectModal}
        onOpenChange={(open) => {
          setShowConnectModal(open);
          if (!open && !connected) {
            // User dismissed modal without connecting - redirect to home
            navigate('/');
          }
        }}
      />
    </div>
  );
};

export default Dashboard;
