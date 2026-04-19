import { FC, useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  ArrowRight,
  Plus,
  Lock,
  DollarSign,
  Shield,
  Wallet,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Send,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  Clock,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageLayout from "@/components/layouts/PageLayout";
import WalletConnectModal from "@/components/modals/WalletConnectModal";
import { useAuth } from "@/context/AuthContext";
import { useModalContext } from "@/context/ModalContext";
import { useMyDeals, useRecentDealEvents, useDeleteDeal, DealRow, DealEventRow } from "@/hooks/useDeals";
import { useEvent } from "@/hooks/useEvent";
import { getConfiguredCluster } from "@/utils/solana";
import { USDC_MINT } from "@/lib/config";
import { formatUsd, shortAddress } from "@/utils/format";

type Tone = "primary" | "secondary" | "accent" | "success" | "destructive" | "muted";

const STATUS_META: Record<string, { label: string; tone: Tone; next: string }> = {
  INIT: { label: "Awaiting fund", tone: "primary", next: "Needs funding" },
  INITIATED: { label: "Awaiting fund", tone: "primary", next: "Needs funding" },
  FUNDED: { label: "In escrow", tone: "accent", next: "Inspection window" },
  DELIVERED: { label: "Delivered", tone: "secondary", next: "Awaiting release" },
  DISPUTED: { label: "Disputed", tone: "destructive", next: "Evidence needed" },
  RESOLVED: { label: "Resolved", tone: "secondary", next: "Ready to claim" },
  RELEASED: { label: "Released", tone: "success", next: "Completed" },
  REFUNDED: { label: "Refunded", tone: "success", next: "Completed" },
};

const INSTRUCTION_META: Record<string, { label: string; icon: React.ElementType; tone: Tone }> = {
  INITIATE: { label: "Deal created", icon: FileText, tone: "muted" },
  FUND: { label: "Funds locked", icon: Lock, tone: "primary" },
  RELEASE: { label: "Funds released", icon: ArrowUpRight, tone: "success" },
  REFUND: { label: "Refund processed", icon: ArrowDownLeft, tone: "secondary" },
  OPEN_DISPUTE: { label: "Dispute opened", icon: AlertTriangle, tone: "destructive" },
  RESOLVE: { label: "AI verdict issued", icon: Scale, tone: "accent" },
};

function pillTone(tone: Tone): string {
  switch (tone) {
    case "success":
      return "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.3)]";
    case "destructive":
      return "bg-destructive/10 text-destructive border-destructive/25";
    case "secondary":
      return "bg-secondary/10 text-secondary border-secondary/25";
    case "accent":
      return "bg-accent/10 text-[hsl(185_90%_28%)] border-accent/35";
    case "muted":
      return "bg-muted text-muted-foreground border-border";
    default:
      return "bg-primary/10 text-primary border-primary/20";
  }
}

function iconTone(tone: Tone): string {
  switch (tone) {
    case "success":
      return "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]";
    case "destructive":
      return "bg-destructive/10 text-destructive";
    case "secondary":
      return "bg-secondary/10 text-secondary";
    case "accent":
      return "bg-accent/10 text-[hsl(185_90%_28%)]";
    case "muted":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-primary/10 text-primary";
  }
}

function timeShort(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeUntil(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return "Overdue";
  const hours = Math.floor(diff / 3600000);
  if (hours < 48) return `${hours}h left`;
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

const Dashboard: FC = () => {
  const navigate = useNavigate();
  const { publicKey, connected, wallet } = useWallet();
  const { connection } = useConnection();
  const { trackEvent } = useEvent();
  const { isAuthenticated, isLoading: isAuthLoading, user: authUser } = useAuth();
  const { openWalletModal } = useModalContext();

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [cluster] = useState(getConfiguredCluster());
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const address = publicKey?.toBase58();
  const userName = authUser?.displayName || authUser?.name || "there";
  const firstName = userName.split(/\s+/)[0] ?? userName;

  useEffect(() => {
    if (connected && publicKey) {
      trackEvent("wallet_connected", {
        wallet_type: wallet?.adapter?.name,
        network: cluster,
        wallet_address: publicKey.toString(),
      });
    }
  }, [connected, publicKey, wallet, cluster, trackEvent]);

  useEffect(() => {
    if (connected) setShowConnectModal(false);
  }, [connected]);

  const fetchWalletData = async () => {
    if (!publicKey || !connected) return;
    setIsBalanceLoading(true);
    try {
      const sol = await connection.getBalance(publicKey);
      setSolBalance(sol / LAMPORTS_PER_SOL);
      try {
        const usdcMint = new PublicKey(USDC_MINT);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: usdcMint });
        const total = tokenAccounts.value.reduce((sum, acc) => {
          const info = acc.account.data.parsed?.info;
          return sum + (info?.tokenAmount?.uiAmount ?? 0);
        }, 0);
        setUsdcBalance(total);
      } catch {
        setUsdcBalance(0);
      }
    } catch (err) {
      console.error("Error fetching wallet data:", err);
    } finally {
      setIsBalanceLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [publicKey, connected, connection]);

  const handleRefresh = () => {
    trackEvent("wallet_refresh", { wallet_address: publicKey?.toString() });
    fetchWalletData();
  };

  const deleteDeal = useDeleteDeal();

  const handleDeleteDeal = (dealId: string) => {
    setPendingDeleteId(dealId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDeal = async () => {
    if (!pendingDeleteId) return;
    trackEvent("deal_delete_click", { deal_id: pendingDeleteId });
    try {
      await deleteDeal.mutateAsync(pendingDeleteId);
    } catch (err) {
      console.error("Failed to delete deal:", err);
    } finally {
      setPendingDeleteId(null);
      setDeleteDialogOpen(false);
    }
  };

  const { data: dealsData, isLoading: dealsLoading } = useMyDeals();
  const { data: eventsData, isLoading: eventsLoading } = useRecentDealEvents(8);

  const deals = dealsData?.deals ?? [];
  const totalDeals = dealsData?.total ?? deals.length;

  const stats = useMemo(() => {
    const active = deals.filter((d) => ["INIT", "INITIATED", "FUNDED", "DELIVERED", "DISPUTED", "RESOLVED"].includes(d.status));
    const inEscrow = active
      .filter((d) => ["FUNDED", "DELIVERED", "DISPUTED", "RESOLVED"].includes(d.status))
      .reduce((s, d) => s + Number(d.price_usd ?? 0), 0);
    const completed = deals.filter((d) => ["RELEASED", "REFUNDED"].includes(d.status));
    const lifetimeVolume = completed.reduce((s, d) => s + Number(d.price_usd ?? 0), 0);
    const pendingReview = deals.find((d) => d.status === "FUNDED" || d.status === "DELIVERED" || d.status === "RESOLVED");
    return { active, inEscrow, completed, lifetimeVolume, pendingReview };
  }, [deals]);

  const featuredDeal: DealRow | undefined = useMemo(() => {
    return (
      deals.find((d) => d.status === "RESOLVED") ||
      deals.find((d) => d.status === "DELIVERED") ||
      deals.find((d) => d.status === "FUNDED") ||
      deals.find((d) => d.status === "DISPUTED") ||
      deals.find((d) => d.status === "INIT" || d.status === "INITIATED")
    );
  }, [deals]);

  const greetingHint = useMemo(() => {
    if (!deals.length) return "Welcome to Artha — create your first escrow deal to get started.";
    if (stats.pendingReview) {
      return `You have ${stats.active.length} active ${stats.active.length === 1 ? "deal" : "deals"}. ${stats.pendingReview.title || "One deal"} needs your attention.`;
    }
    if (stats.active.length) return `${stats.active.length} active ${stats.active.length === 1 ? "deal" : "deals"} in progress. Nothing needs your sign-off right now.`;
    return "All clear — no active deals right now.";
  }, [deals.length, stats]);

  const reputationScore = authUser?.reputationScore ?? 0;
  const reputationPct = Math.max(0, Math.min(100, reputationScore));
  const reputationLabel = reputationScore >= 80 ? "Trusted" : reputationScore >= 50 ? "Established" : reputationScore > 0 ? "New" : "Unrated";

  const activity: DealEventRow[] = eventsData?.slice(0, 5) ?? [];

  return (
    <PageLayout>
      <div className="relative overflow-hidden bg-background">
        <div className="orb top-20 -right-16 w-[280px] h-[280px] bg-primary/20" />
        <div className="orb top-[220px] right-40 w-[180px] h-[180px] bg-accent/15" style={{ animationDelay: "1.5s" }} />

        <div className="relative container mx-auto max-w-7xl px-6 py-10">
          {/* Greeting */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <span className="artha-pill artha-pill-secondary mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                {stats.pendingReview ? "1 deal awaiting your sign-off" : `${totalDeals} total ${totalDeals === 1 ? "deal" : "deals"}`}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-2">
                Welcome back, <span className="gradient-text-two">{firstName}</span>.
              </h1>
              <p className="text-muted-foreground max-w-xl leading-relaxed">{greetingHint}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate("/escrow/step1")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card hover:bg-muted transition-colors font-semibold text-sm"
              >
                <Plus className="w-4 h-4" /> New deal
              </button>
              {stats.pendingReview && (
                <button
                  onClick={() => navigate(`/deal/${stats.pendingReview!.id}`)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-semibold text-sm shadow-primary-custom"
                >
                  Review pending <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Wallet notice */}
          {!connected && (
            <div className="glass-card p-6 mb-6 flex items-center gap-4">
              <div className="icon-tile icon-tile-secondary">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold">Connect a wallet to view balances</div>
                <div className="text-sm text-muted-foreground">Artha uses Solana wallets for secure, on-chain escrow.</div>
              </div>
              <button
                onClick={openWalletModal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-primary-custom"
              >
                <Wallet className="w-4 h-4" /> Connect
              </button>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="In escrow"
              value={formatUsd(stats.inEscrow)}
              hint={`${stats.active.length} active ${stats.active.length === 1 ? "deal" : "deals"}`}
              icon={Lock}
              gradient="primary"
              tone="primary"
            />
            <StatCard
              label="Lifetime volume"
              value={formatUsd(stats.lifetimeVolume)}
              hint={`${stats.completed.length} ${stats.completed.length === 1 ? "deal" : "deals"} completed`}
              icon={DollarSign}
              gradient="secondary"
              tone="secondary"
            />
            <StatCard
              label="Reputation"
              value={reputationScore > 0 ? `${reputationScore}` : "—"}
              hint={reputationLabel}
              icon={Shield}
              gradient="primary"
              tone="accent"
            />
            <StatCard
              label={connected ? "Available · USDC" : "Wallet"}
              value={connected ? (isBalanceLoading ? "…" : `$${(usdcBalance ?? 0).toFixed(2)}`) : "Disconnected"}
              hint={
                connected
                  ? `${(solBalance ?? 0).toFixed(3)} SOL · ${cluster}`
                  : "Connect to deposit"
              }
              icon={Wallet}
              gradient="secondary"
              tone="success"
              right={
                connected ? (
                  <button
                    onClick={handleRefresh}
                    disabled={isBalanceLoading}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Refresh balances"
                  >
                    <RefreshCw className={`w-4 h-4 ${isBalanceLoading ? "animate-spin" : ""}`} />
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* Featured deal */}
          {featuredDeal && <FeaturedDealCard deal={featuredDeal} viewerWallet={address} onOpen={() => navigate(`/deal/${featuredDeal.id}`)} />}

          {/* Table + rail */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-5">
            <div className="glass-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h3 className="text-base font-bold">Active deals</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {totalDeals} {totalDeals === 1 ? "deal" : "deals"} · {formatUsd(stats.inEscrow + stats.lifetimeVolume)} lifetime
                  </p>
                </div>
                <button
                  onClick={() => navigate("/escrow/step1")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-semibold hover:bg-muted transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>

              {dealsLoading ? (
                <div className="px-6 py-12 flex items-center justify-center gap-2 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading deals…
                </div>
              ) : deals.length === 0 ? (
                <div className="px-6 py-14 text-center">
                  <div className="icon-tile mx-auto mb-4">
                    <Lock className="w-5 h-5" />
                  </div>
                  <p className="font-semibold mb-1">No deals yet</p>
                  <p className="text-sm text-muted-foreground mb-5">Create your first escrow deal to lock funds on Solana.</p>
                  <button
                    onClick={() => navigate("/escrow/step1")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-primary-custom"
                  >
                    <Plus className="w-4 h-4" /> Create a deal
                  </button>
                </div>
              ) : (
                <div>
                  {deals.map((d, i) => (
                    <DealRowItem
                      key={d.id}
                      deal={d}
                      viewerWallet={address}
                      isLast={i === deals.length - 1}
                      onOpen={() => navigate(`/deal/${d.id}`)}
                      onDelete={() => handleDeleteDeal(d.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5">
              {/* Reputation card */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-bold">Your reputation</div>
                  <div className="icon-tile icon-tile-secondary" style={{ width: 34, height: 34 }}>
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
                {isAuthLoading ? (
                  <div className="h-10 w-24 rounded bg-muted animate-pulse mb-3" />
                ) : (
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl font-bold gradient-text-two">{reputationScore || 0}</span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                )}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 12 }).map((_, idx) => {
                    const filled = idx < Math.round((reputationPct / 100) * 12);
                    return (
                      <div
                        key={idx}
                        className={`flex-1 h-6 rounded-sm ${filled ? "bg-gradient-primary" : "bg-muted"}`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {reputationScore >= 80
                    ? "You're trusted. Counterparties see your on-chain track record."
                    : stats.completed.length > 0
                    ? `Complete more deals to unlock reduced fees. ${Math.max(0, 25 - stats.completed.length)} away.`
                    : "Complete your first deal to start building reputation on-chain."}
                </p>
              </div>

              {/* Activity */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-bold">Recent activity</div>
                  <button
                    onClick={() => navigate("/notifications")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    View all
                  </button>
                </div>
                {eventsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
                  </div>
                ) : activity.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-2 opacity-60" />
                    No on-chain activity yet.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3.5">
                    {activity.map((evt) => {
                      const meta = INSTRUCTION_META[evt.instruction] ?? {
                        label: evt.instruction,
                        icon: FileText,
                        tone: "muted" as Tone,
                      };
                      const Icon = meta.icon;
                      return (
                        <button
                          key={evt.id}
                          onClick={() => navigate(`/deal/${evt.deal_id}`)}
                          className="flex items-start gap-3 text-left hover:bg-muted/40 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconTone(meta.tone)}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{meta.label}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {evt.deal_title || `Deal ${evt.deal_id.slice(0, 8)}…`}
                              {evt.deal_amount ? ` · ${formatUsd(evt.deal_amount)}` : ""}
                            </div>
                          </div>
                          <div className="text-[11px] text-muted-foreground font-mono-data whitespace-nowrap pt-0.5">
                            {timeShort(evt.created_at)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quick action */}
              <div className="glass-card p-6 flex items-start gap-4">
                <div className="icon-tile">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Start a new deal</div>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Draft an AI-generated contract, invite the counterparty, and lock funds on Solana.
                  </p>
                  <button
                    onClick={() => navigate("/escrow/step1")}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    Create escrow <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <WalletConnectModal
        open={showConnectModal}
        onOpenChange={(open) => {
          setShowConnectModal(open);
          if (!open && !connected) navigate("/");
        }}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this deal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDeal} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageLayout>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: React.ElementType;
  gradient: "primary" | "secondary";
  tone: Tone;
  right?: React.ReactNode;
}

const StatCard: FC<StatCardProps> = ({ label, value, hint, icon: Icon, gradient, tone, right }) => {
  const valueColor =
    tone === "accent"
      ? "text-[hsl(185_90%_28%)]"
      : tone === "success"
      ? "text-[hsl(var(--success))]"
      : tone === "secondary"
      ? "text-secondary"
      : "text-primary";

  return (
    <div className="glass-card p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className={`icon-tile ${gradient === "secondary" ? "icon-tile-secondary" : ""}`} style={{ width: 40, height: 40 }}>
          <Icon className="w-4 h-4" />
        </div>
        {right}
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-1.5">{label}</div>
        <div className={`text-2xl font-bold leading-none mb-1 font-mono-data ${valueColor}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
};

interface FeaturedDealCardProps {
  deal: DealRow;
  viewerWallet?: string;
  onOpen: () => void;
}

const FeaturedDealCard: FC<FeaturedDealCardProps> = ({ deal, viewerWallet, onOpen }) => {
  const counterparty = deal.buyer_wallet === viewerWallet ? deal.seller_wallet : deal.buyer_wallet;
  const viewerIsBuyer = viewerWallet && deal.buyer_wallet === viewerWallet;
  const status = STATUS_META[deal.status] ?? { label: deal.status, tone: "primary" as Tone, next: "" };
  const deadline = deal.deliver_deadline ? new Date(deal.deliver_deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";
  const timeLeft = timeUntil(deal.deliver_deadline);

  const primaryAction = (() => {
    if (deal.status === "FUNDED" && viewerIsBuyer) return "Confirm delivery";
    if (deal.status === "RESOLVED") return "Claim";
    if (deal.status === "INIT" || deal.status === "INITIATED") return viewerIsBuyer ? "Review & fund" : "Open deal";
    return "View details";
  })();

  return (
    <div className="mb-6">
      <div className="gradient-hero-card p-8 relative">
        <div className="absolute inset-0 grid-overlay-light" />
        <div className="relative grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {status.label} · {timeLeft}
              </span>
              <span className="text-[11px] font-mono-data opacity-75">{deal.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="text-3xl font-bold leading-tight mb-2">
              {deal.title?.trim() || `Deal ${deal.id.slice(0, 8)}…`}
            </div>
            <div className="text-sm opacity-80 mb-6">
              with {shortAddress(counterparty)} · {viewerIsBuyer ? "Buyer" : "Seller"}
            </div>

            <div className="flex flex-wrap gap-8">
              <div>
                <div className="text-[11px] uppercase tracking-widest opacity-75 mb-1.5">Holding</div>
                <div className="text-3xl font-bold leading-none font-mono-data">{formatUsd(deal.price_usd)}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest opacity-75 mb-1.5">Deadline</div>
                <div className="text-3xl font-bold leading-none">{deadline}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={onOpen}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white text-primary font-bold text-sm hover:opacity-90 transition-opacity"
            >
              <CheckCircle2 className="w-4 h-4" /> {primaryAction}
            </button>
            <button
              onClick={onOpen}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white/15 backdrop-blur text-white font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" /> Something's wrong
            </button>
            <button
              onClick={onOpen}
              className="text-xs text-white/80 hover:text-white transition-colors text-center py-1"
            >
              View full details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DealRowItemProps {
  deal: DealRow;
  viewerWallet?: string;
  isLast: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

const DealRowItem: FC<DealRowItemProps> = ({ deal, viewerWallet, isLast, onOpen, onDelete }) => {
  const counterparty = deal.buyer_wallet === viewerWallet ? deal.seller_wallet : deal.buyer_wallet;
  const viewerIsBuyer = viewerWallet && deal.buyer_wallet === viewerWallet;
  const status = STATUS_META[deal.status] ?? { label: deal.status, tone: "primary" as Tone, next: "" };
  const title = deal.title?.trim() || `Deal ${deal.id.slice(0, 8)}…`;
  const canDelete = deal.status === "INIT" || deal.status === "INITIATED";

  return (
    <div
      className={`grid grid-cols-[44px_1.6fr_1fr_0.9fr_1.1fr_auto] gap-4 px-6 py-4 items-center hover:bg-muted/40 transition-colors cursor-pointer ${
        !isLast ? "border-b border-border" : ""
      }`}
      onClick={onOpen}
    >
      <div className="w-9 h-9 rounded-lg bg-muted text-primary flex items-center justify-center">
        <FileText className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{title}</div>
        <div className="text-[11px] font-mono-data text-muted-foreground">{deal.id.slice(0, 8).toUpperCase()}</div>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{shortAddress(counterparty)}</div>
        <div className="text-[11px] text-muted-foreground">{viewerIsBuyer ? "Buyer" : "Seller"}</div>
      </div>
      <div className="text-sm font-semibold font-mono-data">{formatUsd(deal.price_usd)}</div>
      <div className="flex flex-col gap-1">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border w-fit ${pillTone(status.tone)}`}
        >
          <span className="w-1 h-1 rounded-full bg-current" />
          {status.label}
        </span>
        <div className="text-[11px] text-muted-foreground">{status.next}</div>
      </div>
      <div className="flex items-center gap-1">
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            aria-label="Delete deal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
};

export default Dashboard;
