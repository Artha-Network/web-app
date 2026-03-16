import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  Search,
  Download,
  ExternalLink,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileX,
} from "lucide-react";
import PageLayout from "@/components/layouts/PageLayout";
import { useMyDeals, type DealRow } from "@/hooks/useDeals";
import { formatDateTime, formatUsd, shortAddress } from "@/utils/format";
import { exportDealsToCSV } from "@/utils/csv";

const ALL_STATUSES = ["ALL", "INIT", "FUNDED", "DELIVERED", "DISPUTED", "RESOLVED", "RELEASED", "REFUNDED"] as const;

const statusBadgeColors: Record<string, string> = {
  INIT: "bg-gray-500 text-white",
  FUNDED: "bg-blue-600 text-white",
  DELIVERED: "bg-indigo-600 text-white",
  DISPUTED: "bg-orange-600 text-white",
  RESOLVED: "bg-purple-600 text-white",
  RELEASED: "bg-green-600 text-white",
  REFUNDED: "bg-red-600 text-white",
};

type SortField = "date" | "amount" | "status";
type SortDir = "asc" | "desc";

const Transactions: React.FC = () => {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58() ?? "";
  const { data, isLoading } = useMyDeals({ pageSize: 9999 });
  const deals = data?.deals ?? [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 ml-1" />
    );
  };

  const filtered = useMemo(() => {
    let result = [...deals];

    // Status filter
    if (statusFilter !== "ALL") {
      result = result.filter((d) => d.status === statusFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          (d.title?.toLowerCase().includes(q)) ||
          d.id.toLowerCase().includes(q) ||
          d.buyer_wallet?.toLowerCase().includes(q) ||
          d.seller_wallet?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "amount":
          cmp = Number(a.price_usd ?? 0) - Number(b.price_usd ?? 0);
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [deals, statusFilter, search, sortField, sortDir]);

  const getCounterparty = (deal: DealRow) => {
    if (deal.buyer_wallet === walletAddress) return deal.seller_wallet;
    return deal.buyer_wallet;
  };

  const getRole = (deal: DealRow) => {
    if (deal.buyer_wallet === walletAddress) return "Buyer";
    if (deal.seller_wallet === walletAddress) return "Seller";
    return "—";
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Card>
            <CardContent className="pt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full mb-2" />
              ))}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <History className="w-8 h-8 text-primary" />
              Transaction History
            </h1>
            <p className="text-muted-foreground mt-1">
              {filtered.length} of {deals.length} transactions
            </p>
          </div>
          {deals.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportDealsToCSV(filtered, walletAddress)}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, ID, or wallet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "ALL" ? "All Statuses" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <FileX className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
                <p className="text-muted-foreground">
                  {deals.length === 0
                    ? "You don't have any deals yet."
                    : "No transactions match your current filters."}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                        onClick={() => toggleSort("date")}
                      >
                        Date
                        <SortIcon field="date" />
                      </button>
                    </TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                        onClick={() => toggleSort("amount")}
                      >
                        Amount
                        <SortIcon field="amount" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center font-medium hover:text-foreground transition-colors"
                        onClick={() => toggleSort("status")}
                      >
                        Status
                        <SortIcon field="status" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTime(deal.created_at)}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {deal.title || `Deal ${deal.id.slice(0, 8)}...`}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getRole(deal)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {shortAddress(getCounterparty(deal))}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatUsd(deal.price_usd)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeColors[deal.status] ?? "bg-gray-500 text-white"}>
                          {deal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/deal/${deal.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Transactions;
