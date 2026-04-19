import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Loader,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Scale,
  FileText,
  Bell,
  Sparkles,
  Lock,
  Brain,
  Shield,
  Zap,
  Clock,
} from "lucide-react";
import PageLayout from "@/components/layouts/PageLayout";
import { useRecentDealEvents, DealEventRow } from "@/hooks/useDeals";
import { formatUsd } from "@/utils/format";

const INSTRUCTION_CONFIG: Record<string, { label: string; icon: React.ElementType; tone: "primary" | "success" | "destructive" | "accent" | "secondary" | "muted" }> = {
  INITIATE: { label: "Deal Created", icon: FileText, tone: "muted" },
  FUND: { label: "Deal Funded", icon: Lock, tone: "primary" },
  RELEASE: { label: "Funds Released", icon: ArrowUpRight, tone: "success" },
  REFUND: { label: "Refund Processed", icon: ArrowDownLeft, tone: "secondary" },
  OPEN_DISPUTE: { label: "Dispute Opened", icon: AlertTriangle, tone: "destructive" },
  RESOLVE: { label: "AI Verdict Issued", icon: Scale, tone: "accent" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function groupByDate(events: DealEventRow[]): { label: string; rows: DealEventRow[] }[] {
  const buckets: Record<string, DealEventRow[]> = { Today: [], Yesterday: [], "Earlier this week": [], Older: [] };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  events.forEach((e) => {
    const t = new Date(e.created_at).getTime();
    if (t >= today) buckets.Today.push(e);
    else if (t >= yesterday) buckets.Yesterday.push(e);
    else if (t >= weekAgo) buckets["Earlier this week"].push(e);
    else buckets.Older.push(e);
  });

  return Object.entries(buckets)
    .filter(([, rows]) => rows.length > 0)
    .map(([label, rows]) => ({ label, rows }));
}

function toneClasses(tone: string): { bg: string; text: string } {
  switch (tone) {
    case "success": return { bg: "bg-[hsl(var(--success)/0.1)]", text: "text-[hsl(var(--success))]" };
    case "destructive": return { bg: "bg-destructive/10", text: "text-destructive" };
    case "secondary": return { bg: "bg-secondary/10", text: "text-secondary" };
    case "accent": return { bg: "bg-accent/10", text: "text-[hsl(185_90%_28%)]" };
    case "muted": return { bg: "bg-muted", text: "text-muted-foreground" };
    default: return { bg: "bg-primary/10", text: "text-primary" };
  }
}

function NotificationRow({ evt }: { evt: DealEventRow }) {
  const config = INSTRUCTION_CONFIG[evt.instruction] ?? {
    label: evt.instruction,
    icon: FileText,
    tone: "muted" as const,
  };
  const Icon = config.icon;
  const tone = toneClasses(config.tone);

  return (
    <Link
      to={`/deal/${evt.deal_id}`}
      className="grid grid-cols-[8px_40px_1fr_auto] gap-4 px-6 py-4 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors items-center"
    >
      <div className="w-2 h-2 rounded-full bg-primary" />
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone.bg} ${tone.text}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold truncate">{config.label}</div>
        <div className="text-xs text-muted-foreground truncate">
          {evt.deal_title || `Deal ${evt.deal_id.slice(0, 8)}…`}
          {evt.deal_amount ? <span className="ml-1 font-mono-data">· {formatUsd(evt.deal_amount)} USDC</span> : null}
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground font-mono-data whitespace-nowrap">
        {timeAgo(evt.created_at)}
      </div>
    </Link>
  );
}

const Notifications: React.FC = () => {
  const { data: events, isLoading } = useRecentDealEvents(30);

  const grouped = useMemo(() => groupByDate(events ?? []), [events]);
  const totalCount = events?.length ?? 0;
  const actionNeeded = useMemo(
    () => (events ?? []).find((e) => e.instruction === "RESOLVE" || e.instruction === "OPEN_DISPUTE"),
    [events],
  );

  return (
    <PageLayout>
      <div className="relative overflow-hidden bg-background">
        <div className="orb top-20 -right-16 w-[260px] h-[260px] bg-primary/20" />
        <div className="orb top-[400px] -left-20 w-[220px] h-[220px] bg-secondary/15" style={{ animationDelay: "1.2s" }} />

        <div className="relative container mx-auto max-w-6xl px-6 py-10">
          {/* Hero header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div>
              <span className="artha-pill mb-4">
                <Bell className="w-3.5 h-3.5" />
                {totalCount} {totalCount === 1 ? "event" : "events"}
                {actionNeeded ? " · action needed" : ""}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-2">
                Your <span className="gradient-text-two">inbox</span>.
              </h1>
              <p className="text-muted-foreground max-w-xl">
                Every deal event — funding, releases, disputes, and AI verdicts — in one timeline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
            {/* Inbox list */}
            <div className="glass-card overflow-hidden">
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
                  <Loader className="w-4 h-4 animate-spin" />
                  Loading notifications…
                </div>
              )}

              {!isLoading && totalCount === 0 && (
                <div className="text-center py-20 px-6">
                  <div className="icon-tile mx-auto mb-4">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="font-semibold">No notifications yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Events from your deals will appear here as they happen.
                  </p>
                </div>
              )}

              {!isLoading && grouped.map((grp, gi) => (
                <div key={grp.label}>
                  <div
                    className="px-6 py-3 bg-muted/40 border-y border-border text-[11px] font-semibold tracking-widest uppercase text-muted-foreground"
                    style={{ borderTop: gi === 0 ? "none" : undefined }}
                  >
                    {grp.label}
                  </div>
                  {grp.rows.map((evt) => (
                    <NotificationRow key={evt.id} evt={evt} />
                  ))}
                </div>
              ))}
            </div>

            {/* Rail */}
            <div className="flex flex-col gap-5">
              {/* Needs action panel */}
              {actionNeeded ? (
                <div className="gradient-hero-card p-6 relative">
                  <div className="absolute inset-0 grid-overlay-light" />
                  <div className="relative">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-[11px] font-semibold tracking-wider uppercase mb-3">
                      <AlertTriangle className="w-3 h-3" /> Needs attention
                    </span>
                    <div className="text-xl font-bold leading-tight mb-2">
                      {actionNeeded.instruction === "RESOLVE"
                        ? "AI verdict ready to review"
                        : "Dispute opened on a deal"}
                    </div>
                    <p className="text-sm opacity-85 leading-relaxed mb-4">
                      {actionNeeded.deal_title ?? `Deal ${actionNeeded.deal_id.slice(0, 8)}…`}
                      {actionNeeded.deal_amount ? ` · ${formatUsd(actionNeeded.deal_amount)}` : ""}
                    </p>
                    <Link
                      to={`/deal/${actionNeeded.deal_id}`}
                      className="inline-flex items-center justify-center w-full px-4 py-2.5 rounded-full bg-white text-primary font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      Review now
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="glass-card p-6 flex items-start gap-4">
                  <div className="icon-tile icon-tile-secondary">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold">All clear</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nothing needs your attention right now. We'll notify you as soon as something changes.
                    </p>
                  </div>
                </div>
              )}

              {/* Event-type legend */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-bold mb-1">Event types</h3>
                <p className="text-xs text-muted-foreground mb-4">What each icon in the timeline means.</p>
                <div className="space-y-3">
                  {Object.entries(INSTRUCTION_CONFIG).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    const tone = toneClasses(cfg.tone);
                    return (
                      <div key={key} className="flex items-center gap-3 text-sm">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone.bg} ${tone.text}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{cfg.label}</div>
                          <div className="text-[11px] font-mono-data text-muted-foreground">{key}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Info card */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="icon-tile" style={{ width: 32, height: 32 }}>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-bold">Real-time updates</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  On-chain events are indexed the moment they confirm on Solana. Email notifications are sent automatically to both buyer and seller for every status change.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Notifications;
