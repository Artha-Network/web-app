import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEvent } from "@/hooks/useEvent";
import { useMyDeals, DealRow } from "@/hooks/useDeals";
import PageLayout from "@/components/layouts/PageLayout";
import { formatUsd, shortAddress } from "@/utils/format";
import { Search, Plus, ArrowRight, Clock, RefreshCw, Eye, User, Filter } from "lucide-react";

const CARD_SHADOW = "0 1px 4px rgba(15,27,45,0.07), 0 0 1px rgba(15,27,45,0.06)";
const BORDER = "1px solid #e8ecf0";

const STATUS_BADGE: Record<string, { label: string; style: React.CSSProperties }> = {
  INIT:      { label: "Init",      style: { background: "#1a3a60", color: "#fff" } },
  INITIATED: { label: "Init",      style: { background: "#1a3a60", color: "#fff" } },
  FUNDED:    { label: "Funded",    style: { background: "#10b981", color: "#fff" } },
  DELIVERED: { label: "Delivered", style: { background: "#6366f1", color: "#fff" } },
  DISPUTED:  { label: "Disputed",  style: { background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5" } },
  RESOLVED:  { label: "Resolved",  style: { background: "#0ba5c0", color: "#fff" } },
  RELEASED:  { label: "Released",  style: { background: "#10b981", color: "#fff" } },
  REFUNDED:  { label: "Refunded",  style: { background: "#6366f1", color: "#fff" } },
};

const STAT_COLORS = [
  { border: "#0ba5c0", iconBg: "#e0f7fb", iconColor: "#0ba5c0" },
  { border: "#6366f1", iconBg: "#ede9fe", iconColor: "#6366f1" },
  { border: "#10b981", iconBg: "#d1fae5", iconColor: "#10b981" },
  { border: "#f59e0b", iconBg: "#fef3c7", iconColor: "#f59e0b" },
];

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
    { label: "Total Deals",     value: total,                icon: <Eye size={15} />,    ...STAT_COLORS[0] },
    { label: "Filtered",        value: filteredDeals.length, icon: <Filter size={15} />, ...STAT_COLORS[1] },
    { label: "Active",          value: stats.active,         icon: <Clock size={15} />,  ...STAT_COLORS[2] },
    { label: "As Buyer",        value: stats.asBuyer,        icon: <User size={15} />,   ...STAT_COLORS[3] },
  ];

  return (
    <PageLayout>
      <div style={{ background: "#f5f7fa", minHeight: "calc(100vh - 56px)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0f1b2d", lineHeight: 1.2 }}>My Deals</div>
              <div style={{ fontSize: 13, color: "#6b7a90", marginTop: 3 }}>Manage your escrow transactions</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => { trackEvent("deals_refresh"); refetch(); }}
                disabled={isLoading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: "#fff", border: BORDER, color: "#0f1b2d",
                  cursor: "pointer", opacity: isLoading ? 0.5 : 1, fontFamily: "inherit",
                }}
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={() => navigate("/escrow/step1")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: "#1a3a60", color: "#fff", border: "none",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <Plus size={14} /> New Deal
              </button>
            </div>
          </div>

          {/* Filters */}
          <div style={{ background: "#fff", border: BORDER, borderRadius: 12, boxShadow: CARD_SHADOW, padding: "20px 22px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#0f1b2d", marginBottom: 14 }}>
              <Filter size={14} /> Filters
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#6b7a90", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Search by Deal ID or wallet address..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    trackEvent("filter_change", { filter_type: "search" });
                  }}
                  style={{
                    width: "100%", height: 38, padding: "0 14px 0 36px",
                    border: "1px solid #e8ecf0", borderRadius: 8, fontSize: 13,
                    background: "#f5f7fa", color: "#0f1b2d", outline: "none", fontFamily: "inherit",
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
                  height: 38, padding: "0 14px", border: "1px solid #e8ecf0",
                  borderRadius: 8, fontSize: 13, background: "#f5f7fa",
                  color: "#0f1b2d", outline: "none", cursor: "pointer",
                  minWidth: 140, fontFamily: "inherit",
                }}
              >
                <option value="all">All Status</option>
                <option value="INIT">Awaiting Fund</option>
                <option value="FUNDED">Funded</option>
                <option value="DELIVERED">Delivered</option>
                <option value="DISPUTED">Disputed</option>
                <option value="RESOLVED">Resolved</option>
                <option value="RELEASED">Released</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
            {statCards.map((stat, i) => (
              <div key={i} style={{
                background: "#fff", border: BORDER, borderRadius: 12, boxShadow: CARD_SHADOW,
                padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stat.border, borderRadius: "12px 12px 0 0" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7a90", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {stat.label}
                  </div>
                  <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: stat.iconBg, color: stat.iconColor, flexShrink: 0 }}>
                    {stat.icon}
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#0f1b2d", lineHeight: 1 }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Deals list */}
          <div style={{ background: "#fff", border: BORDER, borderRadius: 12, boxShadow: CARD_SHADOW, overflow: "hidden" }}>
            <div style={{ padding: "20px 22px 16px", borderBottom: "1px solid #e8ecf0", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f1b2d" }}>Deals</div>
                <div style={{ fontSize: 12, color: "#6b7a90", marginTop: 2 }}>
                  {isLoading ? "Loading deals…" : `Showing ${filteredDeals.length} of ${total} deals`}
                </div>
              </div>
            </div>

            {isLoading ? (
              <div style={{ padding: "60px 22px", textAlign: "center", color: "#6b7a90" }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 12px", display: "block" }} />
                Loading deals…
              </div>
            ) : filteredDeals.length === 0 ? (
              <div style={{ padding: "60px 22px", textAlign: "center", color: "#6b7a90" }}>
                <Eye size={40} style={{ margin: "0 auto 14px", display: "block", color: "#c0cbd8" }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0f1b2d", marginBottom: 6 }}>No deals found</div>
                <div style={{ fontSize: 13 }}>
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters or create a new deal."
                    : "You haven't created any deals yet."}
                </div>
                {!searchTerm && statusFilter === "all" && (
                  <button
                    onClick={() => navigate("/escrow/step1")}
                    style={{
                      marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: "#1a3a60", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    <Plus size={14} /> Create First Deal
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 20 }}>
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                style={{
                  padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: "#fff", border: BORDER, color: "#0f1b2d",
                  cursor: page === 0 ? "default" : "pointer", opacity: page === 0 ? 0.4 : 1, fontFamily: "inherit",
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: 13, color: "#6b7a90" }}>Page {page + 1} of {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * pageSize >= total}
                style={{
                  padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  background: "#fff", border: BORDER, color: "#0f1b2d",
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
  const badge = STATUS_BADGE[deal.status] ?? { label: deal.status, style: { background: "#e8ecf0", color: "#6b7a90" } };
  const title = deal.title?.trim() || `Deal ${deal.id.slice(0, 8)}…`;
  const createdDate = deal.created_at ? new Date(deal.created_at).toLocaleDateString() : "—";
  const deadline = deal.deliver_deadline ? new Date(deal.deliver_deadline).toLocaleDateString() : null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", padding: "18px 22px",
        borderBottom: isLast ? "none" : "1px solid #e8ecf0",
        cursor: "pointer", gap: 16, background: hovered ? "#f9fbfc" : "#fff",
        transition: "background 0.12s",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
          <span style={{
            display: "inline-flex", alignItems: "center",
            padding: "3px 9px", borderRadius: 5,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase",
            ...badge.style,
          }}>
            {badge.label}
          </span>
          <span style={{ fontSize: 12, fontWeight: 500, color: "#6b7a90" }}>
            {isBuyer ? "Buyer" : "Seller"}
          </span>
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#0f1b2d", marginBottom: 2 }}>
          {formatUsd(deal.price_usd)}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#0f1b2d", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: "#6b7a90", lineHeight: 1.7 }}>
          <span>ID: {deal.id.slice(0, 8)}…</span>
          <span> · Counterparty: {shortAddress(counterparty)}</span>
          <span> · Created: {createdDate}</span>
          {deadline && <span> · Deadline: {deadline}</span>}
        </div>
      </div>
      <ArrowRight
        size={18}
        style={{
          flexShrink: 0,
          color: hovered ? "#0ba5c0" : "#6b7a90",
          transform: hovered ? "translateX(3px)" : "translateX(0)",
          transition: "transform 0.15s, color 0.15s",
        }}
      />
    </div>
  );
};

export default Deals;
