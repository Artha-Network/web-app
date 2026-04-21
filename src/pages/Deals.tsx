import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEvent } from "@/hooks/useEvent";
import { useMyDeals, DealRow } from "@/hooks/useDeals";
import PageLayout from "@/components/layouts/PageLayout";
import { formatUsd, shortAddress } from "@/utils/format";
import { Search, Plus, ArrowRight, Clock, RefreshCw, Eye, User, Filter } from "lucide-react";

const STAT_COLORS = [
  { border: "#0d9488", iconBg: "#f0fdfa", iconColor: "#0d9488" },
  { border: "#7c3aed", iconBg: "#f5f3ff", iconColor: "#7c3aed" },
  { border: "#16a34a", iconBg: "#f0fdf4", iconColor: "#16a34a" },
  { border: "#d97706", iconBg: "#fffbeb", iconColor: "#d97706" },
];

// Dark-panel badge styles
const STATUS_BADGE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  INIT:      { label: "INIT",      bg: "oklch(0.28 0.04 250)", color: "oklch(0.75 0.12 250)", border: "1px solid oklch(0.38 0.06 250)" },
  INITIATED: { label: "INIT",      bg: "oklch(0.28 0.04 250)", color: "oklch(0.75 0.12 250)", border: "1px solid oklch(0.38 0.06 250)" },
  FUNDED:    { label: "FUNDED",    bg: "oklch(0.28 0.10 165)", color: "oklch(0.75 0.14 165)", border: "1px solid oklch(0.40 0.12 165)" },
  DELIVERED: { label: "DELIVERED", bg: "oklch(0.28 0.08 290)", color: "oklch(0.75 0.12 290)", border: "1px solid oklch(0.38 0.10 290)" },
  DISPUTED:  { label: "DISPUTED",  bg: "oklch(0.28 0.10 25)",  color: "oklch(0.75 0.14 25)",  border: "1px solid oklch(0.40 0.12 25)"  },
  RESOLVED:  { label: "RESOLVED",  bg: "oklch(0.28 0.08 165)", color: "oklch(0.75 0.12 165)", border: "1px solid oklch(0.38 0.10 165)" },
  RELEASED:  { label: "RELEASED",  bg: "oklch(0.28 0.10 165)", color: "oklch(0.75 0.14 165)", border: "1px solid oklch(0.40 0.12 165)" },
  REFUNDED:  { label: "REFUNDED",  bg: "oklch(0.28 0.08 290)", color: "oklch(0.75 0.12 290)", border: "1px solid oklch(0.38 0.10 290)" },
};

const DEALS_PANEL_SHADOW =
  "0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.10), 0 16px 40px rgba(0,0,0,.18), 0 28px 0 -6px #d1d5db, 0 32px 0 -6px #e5e7eb";

const Deals: React.FC = () => {
  const { publicKey } = useWallet();
  const navigate = useNavigate();
  const { trackEvent, trackPageView } = useEvent();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const { data: dealsData, isLoading, refetch } = useMyDeals({ page, pageSize });
  const deals = dealsData?.deals ?? [];
  const total = dealsData?.total ?? 0;

  useEffect(() => { trackPageView("deal_list"); }, [trackPageView]);

  const filteredDeals = useMemo(
    () =>
      deals.filter((deal) => {
        const matchSearch =
          !searchTerm ||
          deal.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.buyer_wallet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.seller_wallet?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "all" || deal.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [deals, searchTerm, statusFilter],
  );

  const stats = useMemo(() => {
    const active = deals.filter((d) =>
      ["INIT", "INITIATED", "FUNDED", "DELIVERED", "DISPUTED", "RESOLVED"].includes(d.status),
    ).length;
    const asBuyer = deals.filter((d) => d.buyer_wallet === publicKey?.toBase58()).length;
    return { active, asBuyer };
  }, [deals, publicKey]);

  const userWallet = publicKey?.toBase58();
  const totalPages = Math.ceil(total / pageSize);

  const statCards = [
    { label: "Total Deals",     value: total,                icon: <Eye size={14} />,    ...STAT_COLORS[0] },
    { label: "Filtered",        value: filteredDeals.length, icon: <Filter size={14} />, ...STAT_COLORS[1] },
    { label: "Active",          value: stats.active,         icon: <Clock size={14} />,  ...STAT_COLORS[2] },
    { label: "As Buyer",        value: stats.asBuyer,        icon: <User size={14} />,   ...STAT_COLORS[3] },
  ];

  return (
    <PageLayout>
      <div style={{ background: "#f4f5f7", minHeight: "calc(100vh - 56px)" }}>
        <div style={{ maxWidth: 840, margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 600, color: "#1a1d23", letterSpacing: "-0.3px" }}>My Deals</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 3 }}>Manage your escrow transactions</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => { trackEvent("deals_refresh"); refetch(); }}
                disabled={isLoading}
                style={{
                  height: 36, padding: "0 14px", borderRadius: 8,
                  display: "inline-flex", alignItems: "center", gap: 6,
                  border: "1px solid #e4e6ea", background: "#fff",
                  fontSize: 13, fontWeight: 500, color: "#6b7280",
                  cursor: isLoading ? "default" : "pointer", opacity: isLoading ? 0.5 : 1,
                  fontFamily: "inherit", transition: "background .15s, color .15s",
                }}
              >
                <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={() => navigate("/escrow/step1")}
                style={{
                  height: 36, padding: "0 16px", borderRadius: 8,
                  display: "inline-flex", alignItems: "center", gap: 6,
                  border: "none", background: "#1e293b", color: "#fff",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Plus size={13} /> New Deal
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div style={{ background: "#fff", border: "1px solid #e4e6ea", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "#6b7280", marginBottom: 10 }}>
              <Filter size={12} /> Filters
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Search by Deal ID or wallet address..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    trackEvent("filter_change", { filter_type: "search" });
                  }}
                  style={{
                    width: "100%", height: 38, padding: "0 12px 0 36px",
                    border: "1px solid #e4e6ea", borderRadius: 8, fontSize: 13,
                    background: "#f4f5f7", color: "#1a1d23", outline: "none", fontFamily: "inherit",
                  }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                  trackEvent("filter_change", { filter_type: "status" });
                }}
                style={{
                  height: 38, padding: "0 32px 0 12px", border: "1px solid #e4e6ea",
                  borderRadius: 8, fontSize: 13, background: "#f4f5f7",
                  color: "#1a1d23", outline: "none", cursor: "pointer",
                  fontFamily: "inherit", appearance: "none",
                }}
              >
                <option value="all">All Status</option>
                <option value="INIT">INIT</option>
                <option value="FUNDED">FUNDED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="DISPUTED">DISPUTED</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="RELEASED">RELEASED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {statCards.map((stat, i) => (
              <div key={i} style={{
                background: "#fff", border: "1px solid #e4e6ea", borderRadius: 12,
                padding: 16, position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stat.border, borderRadius: "12px 12px 0 0" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", color: "#6b7280" }}>
                    {stat.label}
                  </div>
                  <div style={{ width: 28, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: stat.iconBg, color: stat.iconColor }}>
                    {stat.icon}
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.5px", color: "#1a1d23" }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Deals panel — dark contrasting */}
          <div style={{
            background: "#111827",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: DEALS_PANEL_SHADOW,
          }}>
            {/* Panel header — always dark */}
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid #374151",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#111827",
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#f9fafb" }}>Deals</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9ca3af", fontWeight: 450, marginTop: 2 }}>
                  Showing
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    background: "oklch(0.55 0.18 250)", color: "#fff",
                    fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "1px 8px", letterSpacing: "0.2px",
                  }}>
                    {isLoading ? "…" : `${filteredDeals.length} of ${total}`}
                  </span>
                  deals
                </div>
              </div>
            </div>

            {isLoading ? (
              <div style={{ padding: "60px 24px", textAlign: "center", color: "#6b7280" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px", display: "block", color: "#4b5563" }} />
                <span style={{ color: "#9ca3af" }}>Loading deals…</span>
              </div>
            ) : filteredDeals.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center" }}>
                <Eye size={40} style={{ margin: "0 auto 14px", display: "block", color: "#374151" }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: "#f9fafb", marginBottom: 6 }}>No deals found</div>
                <div style={{ fontSize: 13, color: "#9ca3af" }}>
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters or create a new deal."
                    : "You haven't created any deals yet."}
                </div>
                {!searchTerm && statusFilter === "all" && (
                  <button
                    onClick={() => navigate("/escrow/step1")}
                    style={{
                      marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6,
                      height: 36, padding: "0 16px", borderRadius: 8,
                      background: "#1e293b", color: "#fff", border: "1px solid #374151",
                      fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <Plus size={13} /> Create First Deal
                  </button>
                )}
              </div>
            ) : (
              filteredDeals.map((deal, i) => (
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
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 28 }}>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{
                  height: 36, padding: "0 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: "#fff", border: "1px solid #e4e6ea", color: "#6b7280",
                  cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1, fontFamily: "inherit",
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * pageSize >= total}
                style={{
                  height: 36, padding: "0 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                  background: "#fff", border: "1px solid #e4e6ea", color: "#6b7280",
                  cursor: (page + 1) * pageSize >= total ? "default" : "pointer",
                  opacity: (page + 1) * pageSize >= total ? 0.4 : 1, fontFamily: "inherit",
                }}
              >
                Next
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
  const [hovered, setHovered] = useState(false);
  const isBuyer = userWallet === deal.buyer_wallet;
  const counterparty = isBuyer ? deal.seller_wallet : deal.buyer_wallet;
  const badge = STATUS_BADGE[deal.status] ?? { label: deal.status, bg: "oklch(0.28 0.02 250)", color: "oklch(0.75 0.06 250)", border: "1px solid oklch(0.38 0.04 250)" };
  const title = deal.title?.trim() || `Deal ${deal.id.slice(0, 8)}…`;
  const createdDate = deal.created_at ? new Date(deal.created_at).toLocaleDateString() : "—";
  const deadline = deal.deliver_deadline ? new Date(deal.deliver_deadline).toLocaleDateString() : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", padding: "18px 24px",
        borderBottom: isLast ? "none" : "1px solid #2d3748",
        cursor: "pointer", gap: 16,
        background: hovered ? "#374151" : "transparent",
        transition: "background 0.15s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
            borderRadius: 5, padding: "2px 7px", textTransform: "uppercase",
            background: badge.bg, color: badge.color, border: badge.border,
          }}>
            {badge.label}
          </span>
          <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 450 }}>
            {isBuyer ? "Buyer" : "Seller"}
          </span>
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: "#f9fafb", marginBottom: 3, letterSpacing: "-0.2px" }}>
          {formatUsd(deal.price_usd)}
        </div>
        <div style={{ fontSize: 13, color: "oklch(0.75 0.04 250)", fontWeight: 450, marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          <span>ID: {deal.id.slice(0, 8)}…</span>
          <span> · Counterparty: {shortAddress(counterparty)}</span>
          <span> · Created: {createdDate}</span>
          {deadline && <span> · Deadline: {deadline}</span>}
        </div>
      </div>
      <ArrowRight
        size={16}
        style={{
          flexShrink: 0,
          color: hovered ? "#f9fafb" : "#6b7280",
          transform: hovered ? "translateX(3px)" : "translateX(0)",
          transition: "transform 0.15s, color 0.15s",
        }}
      />
    </div>
  );
};

export default Deals;
