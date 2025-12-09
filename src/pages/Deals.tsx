import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEvent } from "@/hooks/useEvent";
import { useMyDeals, statusToBadge, DealRow } from "@/hooks/useDeals";
import PageLayout from "@/components/layouts/PageLayout";
import {
  Search,
  Filter,
  Plus,
  ArrowRight,
  Clock,
  DollarSign,
  User,
  RefreshCw,
  Eye
} from 'lucide-react';

/**
 * Deals Page - List view of all deals
 * 
 * Purpose: list view of all deals
 * Emits: view_deal_list, filter_change, row_open
 * Storage: reads deals table
 * AI: none
 * Solana (read): optional PDA status refresh for visible rows
 * Links: /deal/:id
 */

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
};

const formatUsd = (value?: string) => {
  const parsed = Number(value ?? 0);
  return `$${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const Deals: React.FC = () => {
  const { publicKey } = useWallet();
  const { trackEvent, trackPageView } = useEvent();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const { data: dealsData, isLoading, refetch } = useMyDeals({ page, pageSize });
  const deals = dealsData?.deals ?? [];
  const total = dealsData?.total ?? 0;

  // Track page view on mount
  useEffect(() => {
    trackPageView('deal_list');
  }, [trackPageView]);

  // Filter deals based on search and status
  const filteredDeals = deals.filter(deal => {
    const matchesSearch = !searchTerm ||
      deal.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.buyer_wallet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.seller_wallet?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || statusToBadge(deal.status) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    trackEvent('filter_change', {
      filter_type: 'search',
      search_term: value
    });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    trackEvent('filter_change', {
      filter_type: 'status',
      status_filter: value
    });
  };

  const handleDealClick = (dealId: string) => {
    trackEvent('row_open', { deal_id: dealId });
  };

  const handleRefresh = () => {
    trackEvent('deals_refresh');
    refetch();
  };

  const userWallet = publicKey?.toBase58();

  // Show wallet connection prompt if not connected
  if (!publicKey) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="pt-6">
              <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
              <p className="text-muted-foreground mb-4">
                Please connect your wallet to view your deals.
              </p>
              <Link to="/wallet-connect">
                <Button>Connect Wallet</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Deals</h1>
            <p className="text-muted-foreground">
              Manage your escrow transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/escrow/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Deal
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by Deal ID or wallet address..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="INIT">Initiated</SelectItem>
                    <SelectItem value="FUNDED">Funded</SelectItem>
                    <SelectItem value="DISPUTED">Disputed</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Deals</p>
                  <p className="text-xl font-bold">{total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Filtered</p>
                  <p className="text-xl font-bold">{filteredDeals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-xl font-bold">
                    {deals.filter(d => ['INIT', 'FUNDED', 'DISPUTED'].includes(statusToBadge(d.status))).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">As Buyer</p>
                  <p className="text-xl font-bold">
                    {deals.filter(d => d.buyer_wallet === userWallet).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deals List */}
        <Card>
          <CardHeader>
            <CardTitle>Deals</CardTitle>
            <CardDescription>
              {isLoading ? "Loading deals..." : `Showing ${filteredDeals.length} of ${total} deals`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No deals found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "You haven't created any deals yet. Create your first deal to get started."
                  }
                </p>
                {!searchTerm && statusFilter === "all" && (
                  <Link to="/escrow/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Deal
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    userWallet={userWallet}
                    onDealClick={handleDealClick}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {Math.ceil(total / pageSize)}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={(page + 1) * pageSize >= total}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
    </PageLayout>
  );
};

interface DealCardProps {
  deal: DealRow;
  userWallet?: string;
  onDealClick: (dealId: string) => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, userWallet, onDealClick }) => {
  const isBuyer = userWallet === deal.buyer_wallet;
  const role = isBuyer ? "Buyer" : "Seller";
  const counterparty = isBuyer ? deal.seller_wallet : deal.buyer_wallet;

  return (
    <Link to={`/deal/${deal.id}`} onClick={() => onDealClick(deal.id)}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge>{statusToBadge(deal.status)}</Badge>
                <Badge variant="outline">{role}</Badge>
              </div>
              <div>
                <p className="font-semibold">{formatUsd(deal.price_usd)}</p>
                <p className="text-sm text-muted-foreground">
                  {deal.title && deal.title.trim() ? deal.title.trim() : `Deal ID: ${deal.id.slice(0, 8)}...`}
                </p>
                <p className="text-sm text-muted-foreground">
                  ID: {deal.id.slice(0, 8)}...
                </p>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>Counterparty: {counterparty ? `${counterparty.slice(0, 8)}...` : "—"}</p>
                <p>Created: {formatDateTime(deal.created_at)}</p>
                {deal.deliver_deadline && (
                  <p>Deadline: {formatDateTime(deal.deliver_deadline)}</p>
                )}
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default Deals;
