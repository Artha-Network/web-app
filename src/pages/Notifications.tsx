import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  Loader,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Scale,
  FileText,
} from "lucide-react";
import PageLayout from "@/components/layouts/PageLayout";
import { useRecentDealEvents, DealEventRow } from "@/hooks/useDeals";
import { formatUsd } from "@/utils/format";

const INSTRUCTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; dotColor: string }> = {
  INITIATE: { label: "Deal Created", icon: FileText, color: "text-gray-600", dotColor: "bg-gray-500" },
  FUND: { label: "Deal Funded", icon: DollarSign, color: "text-blue-600", dotColor: "bg-blue-500" },
  RELEASE: { label: "Funds Released", icon: ArrowUpRight, color: "text-green-600", dotColor: "bg-green-500" },
  REFUND: { label: "Refund Processed", icon: ArrowDownLeft, color: "text-red-600", dotColor: "bg-red-500" },
  OPEN_DISPUTE: { label: "Dispute Opened", icon: AlertTriangle, color: "text-orange-600", dotColor: "bg-orange-500" },
  RESOLVE: { label: "AI Verdict Issued", icon: Scale, color: "text-purple-600", dotColor: "bg-purple-500" },
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

function TimelineItem({ evt }: { evt: DealEventRow }) {
  const config = INSTRUCTION_CONFIG[evt.instruction] ?? {
    label: evt.instruction,
    icon: FileText,
    color: "text-gray-600",
    dotColor: "bg-gray-400",
  };
  const Icon = config.icon;

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${config.dotColor} ring-4 ring-background z-10 shrink-0 mt-1`} />
        <div className="w-px flex-1 bg-border" />
      </div>

      {/* Content */}
      <Link
        to={`/deal/${evt.deal_id}`}
        className="flex-1 group rounded-lg border p-4 hover:bg-muted/50 transition-colors -mt-1"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`p-2 rounded-lg bg-muted shrink-0 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm group-hover:underline">
                {config.label}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {evt.deal_title || `Deal ${evt.deal_id.slice(0, 8)}...`}
              </p>
              {evt.deal_amount && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatUsd(evt.deal_amount)} USDC
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {timeAgo(evt.created_at)}
            </span>
            {evt.deal_status && (
              <Badge variant="outline" className="text-xs">
                {evt.deal_status}
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

const Notifications: React.FC = () => {
  const { data: events, isLoading } = useRecentDealEvents(30);

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Notifications</h1>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
            <Loader className="w-4 h-4 animate-spin" />
            Loading notifications...
          </div>
        )}

        {!isLoading && (!events || events.length === 0) && (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No notifications yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Events from your deals will appear here as a timeline.</p>
          </div>
        )}

        {events && events.length > 0 && (
          <div className="relative">
            {events.map((evt) => (
              <TimelineItem key={evt.id} evt={evt} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Notifications;
