import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvent } from "@/hooks/useEvent";
import { useMyDeals, DealRow } from "@/hooks/useDeals";
import PageLayout from "@/components/layouts/PageLayout";
import { formatUsd, shortAddress } from "@/utils/format";
import {
  Search,
  Plus,
  ArrowRight,
  Clock,
  DollarSign,
  RefreshCw,
  FileText,
  Lock,
  Wallet,
  Eye,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

type Tone = "primary" | "secondary" | "accent" | "success" | "destructive" | "muted";

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  INIT: { label: "Awaiting fund", tone: "primary" },
  INITIATED: { label: "Awaiting fund", tone: "primary" },
  FUNDED: { label: "In escrow", tone: "accent" },
  DELIVERED: { label: "Delivered", tone: "secondary" },
  DISPUTED: { label: "Disputed", tone: "destructive" },
  RESOLVED: { label: "Resolved", tone: "secondary" },
  RELEASED: { label: "Released", tone: "success" },
  REFUNDED: { label: "Refunded", tone: "success" },
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

const Deals: React.FC = () => {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const { trackEvent, trackPageView } = useEvent();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const { data: dealsData, isLoading, refetch } = useMyDeals({ page, pageSize });
  const deals = dealsData?.deals ?? [];
  const total = dealsData?.total ?? 0;

  useEffect(() => {
    trackPageView("deal_list");
  }, [trackPageView]);

  const filteredDeals = useMemo(
    () =>
      deals.filter((deal) => {
        const matchesSearch =
          !searchTerm ||
          deal.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.buyer_wallet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.seller_wallet?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || deal.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [deals, searchTerm, statusFilter],
  );

  const stats = useMemo(() => {
    const active = deals.filter((d) =>
      ["INIT", "INITIATED", "FUNDED", "DELIVERED", "DISPUTED", "RESOLVED"].includes(d.status),
    );
    const inEscrow = active
      .filter((d) => ["FUNDED", "DELIVERED", "DISPUTED", "RESOLVED"].includes(d.status))
      .reduce((s, d) => s + Number(d.price_usd ?? 0), 0);
    const asBuyer = deals.filter((d) => d.buyer_wallet === publicKey?.toBase58()).length;
    return { active: active.length, inEscrow, asBuyer };
  }, [deals, publicKey]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    trackEvent("filter_change", { filter_type: "search", search_term: value });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(0);
    trackEvent("filter_change", { filter_type: "status", status_filter: value });
  };

  const handleRefresh = () => {
    trackEvent("deals_refresh");
    refetch();
  };

  const userWallet = publicKey?.toBase58();
  const totalPages = Math.ceil(total / pageSize);

  if (!publicKey) {
    return (
      <PageLayout>
        <div className="relative overflow-hidden bg-background">
          <div className="orb top-20 -right-16 w-[280px] h-[280px] bg-primary/20" />
          <div className="relative container mx-auto max-w-2xl px-6 py-24 text-center">
            <div className="icon-tile mx-auto mb-6" style={{ width: 56, height: 56 }}>
              <Wallet className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Wallet required</h2>
            <p className="text-muted-foreground mb-6">Connect your wallet to view your escrow deals.</p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-primary-custom"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="relative overflow-hidden bg-background">
        <div className="orb top-20 -right-16 w-[280px] h-[280px] bg-primary/20" />
        <div className="orb top-[220px] right-40 w-[180px] h-[180px] bg-accent/15" style={{ animationDelay: "1.5s" }} />

        <div className="relative container mx-auto max-w-7xl px-6 py-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <span className="artha-pill artha-pill-secondary mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                {total} total {total === 1 ? "deal" : "deals"}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-2">
                Your <span className="gradient-text-two">deals</span>.
              </h1>
              <p className="text-muted-foreground max-w-xl leading-relaxed">
                All your escrow transactions in one place.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card hover:bg-muted transition-colors font-semibold text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={() => navigate("/escrow/step1")}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-semibold text-sm shadow-primary-custom"
              >
                <Plus className="w-4 h-4" /> New deal
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-5 flex flex-col gap-4">
              <div className="icon-tile" style={{ width: 40, height: 40 }}>
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-1.5">Total deals</div>
                <div className="text-2xl font-bold leading-none mb-1 font-mono-data text-primary">{total}</div>
                <div className="text-xs text-muted-foreground">All time</div>
              </div>
            </div>
            <div className="glass-card p-5 flex flex-col gap-4">
              <div className="icon-tile" style={{ width: 40, height: 40 }}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-1.5">Active</div>
                <div className="text-2xl font-bold leading-none mb-1 font-mono-data text-primary">{stats.active}</div>
                <div className="text-xs text-muted-foreground">In progress</div>
              </div>
            </div>
            <div className="glass-card p-5 flex flex-col gap-4">
              <div className="icon-tile icon-tile-secondary" style={{ width: 40, height: 40 }}>
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-1.5">In escrow</div>
                <div className="text-2xl font-bold leading-none mb-1 font-mono-data text-secondary">{formatUsd(stats.inEscrow)}</div>
                <div className="text-xs text-muted-foreground">Currently locked</div>
              </div>
            </div>
            <div className="glass-card p-5 flex flex-col gap-4">
              <div className="icon-tile icon-tile-secondary" style={{ width: 40, height: 40 }}>
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-widest font-medium text-muted-foreground mb-1.5">As buyer</div>
                <div className="text-2xl font-bold leading-none mb-1 font-mono-data text-secondary">{stats.asBuyer}</div>
                <div className="text-xs text-muted-foreground">Of {total} deals</div>
              </div>
            </div>
          </div>

          {/* Filters + list */}
          <div className="glass-card overflow-hidden">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 px-6 py-4 border-b border-border">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, deal ID, or wallet…"
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 rounded-full border-border bg-background"
                />
              </div>
              <div className="sm:w-44">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="rounded-full border-border bg-background">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="INIT">Awaiting fund</SelectItem>
                    <SelectItem value="FUNDED">In escrow</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="DISPUTED">Disputed</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="RELEASED">Released</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Column headers */}
            {!isLoading && filteredDeals.length > 0 && (
              <div className="grid grid-cols-[44px_1.6fr_1fr_0.9fr_1.1fr_auto] gap-4 px-6 py-2 border-b border-border">
                <div />
                <div className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">Deal</div>
                <div className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">Counterparty</div>
                <div className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">Amount</div>
                <div className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">Status</div>
                <div />
              </div>
            )}

            {/* Rows */}
            {isLoading ? (
              <div className="px-6 py-12 flex items-center justify-center gap-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" /> Loading deals…
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <div className="icon-tile mx-auto mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <p className="font-semibold mb-1">
                  {searchTerm || statusFilter !== "all" ? "No deals match your filters" : "No deals yet"}
                </p>
                <p className="text-sm text-muted-foreground mb-5">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or status filter."
                    : "Create your first escrow deal to lock funds on Solana."}
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <button
                    onClick={() => navigate("/escrow/step1")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-primary-custom"
                  >
                    <Plus className="w-4 h-4" /> Create a deal
                  </button>
                )}
              </div>
            ) : (
              <div>
                {filteredDeals.map((deal, i) => (
                  <DealRowItem
                    key={deal.id}
                    deal={deal}
                    userWallet={userWallet}
                    isLast={i === filteredDeals.length - 1}
                    onClick={() => {
                      trackEvent("row_open", { deal_id: deal.id });
                      navigate(`/deal/${deal.id}`);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * pageSize >= total}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

interface DealRowItemProps {
  deal: DealRow;
  userWallet?: string;
  isLast: boolean;
  onClick: () => void;
}

const DealRowItem: React.FC<DealRowItemProps> = ({ deal, userWallet, isLast, onClick }) => {
  const isBuyer = userWallet === deal.buyer_wallet;
  const counterparty = isBuyer ? deal.seller_wallet : deal.buyer_wallet;
  const status = STATUS_META[deal.status] ?? { label: deal.status, tone: "muted" as Tone };
  const title = deal.title?.trim() || `Deal ${deal.id.slice(0, 8)}…`;

  return (
    <div
      className={`grid grid-cols-[44px_1.6fr_1fr_0.9fr_1.1fr_auto] gap-4 px-6 py-4 items-center hover:bg-muted/40 transition-colors cursor-pointer ${
        !isLast ? "border-b border-border" : ""
      }`}
      onClick={onClick}
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
        <div className="text-[11px] text-muted-foreground">{isBuyer ? "Buyer" : "Seller"}</div>
      </div>
      <div className="text-sm font-semibold font-mono-data">{formatUsd(deal.price_usd)}</div>
      <div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border w-fit ${pillTone(status.tone)}`}
        >
          <span className="w-1 h-1 rounded-full bg-current" />
          {status.label}
        </span>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground" />
    </div>
  );
};

export default Deals;
