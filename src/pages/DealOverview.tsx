import React, { useMemo, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useDeal, useResolution } from "@/hooks/useDeals";
import { useAction } from "@/hooks/useAction";
import { useEvent } from "@/hooks/useEvent";
import { useQuery } from "@tanstack/react-query";
import { API_BASE, USDC_MINT } from "@/lib/config";
import PageLayout from "@/components/layouts/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  User,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Car,
  Mail,
  Shield,
  FileText,
  HandshakeIcon,
  BanIcon,
  Gavel,
  Brain,
  Timer,
  Share2,
  Printer,
} from "lucide-react";
import ShareDealDialog from "@/components/molecules/ShareDealDialog";
import ReceiptDialog from "@/components/molecules/ReceiptDialog";
import { formatDateTime, formatUsd, getExplorerUrl } from "@/utils/format";

// Fetch VIN title status from gov endpoint
async function fetchTitleStatus(vin: string): Promise<{ vin: string; title_status: string; current_owner_wallet: string; transfer_date: string | null } | null> {
  try {
    const res = await fetch(`${API_BASE}/gov/title/${vin}`);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      vin: data.vin,
      title_status: data.title_status || data.titleStatus || "PENDING",
      current_owner_wallet: data.current_owner_wallet || data.currentOwnerWallet || "",
      transfer_date: data.transfer_date || data.transferDate || null,
    };
  } catch {
    return null;
  }
}

const statusColors: Record<string, string> = {
  INIT: "bg-gray-500",
  FUNDED: "bg-blue-600",
  DELIVERED: "bg-indigo-600",
  DISPUTED: "bg-orange-600",
  RESOLVED: "bg-purple-600",
  RELEASED: "bg-green-600",
  REFUNDED: "bg-red-600",
};

// Fetch USDC token balance for a wallet
async function fetchUsdcBalance(connection: any, wallet: PublicKey): Promise<number> {
  try {
    const mint = new PublicKey(USDC_MINT);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet, { mint });
    if (!tokenAccounts.value.length) return 0;
    const balance = tokenAccounts.value[0]?.account?.data?.parsed?.info?.tokenAmount;
    return balance ? Number(balance.uiAmount) : 0;
  } catch {
    return -1; // unknown
  }
}

const DealOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dealId = id ?? "";
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { trackEvent, trackAction, trackDealEvent } = useEvent();
  const walletAddress = publicKey?.toBase58();

  const navigate = useNavigate();
  const { data: deal, isLoading, refetch } = useDeal(dealId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const fundAction = useAction("fund");
  const confirmDeliveryAction = useAction("confirmDelivery");
  const approveRefundAction = useAction("approveRefund");
  const { data: resolution } = useResolution(
    deal?.status === "RESOLVED" ? dealId : undefined
  );

  const isBuyer = walletAddress && deal?.buyer_wallet?.toLowerCase() === walletAddress.toLowerCase();
  const isSeller = walletAddress && deal?.seller_wallet?.toLowerCase() === walletAddress.toLowerCase();
  const isParticipant = isBuyer || isSeller;
  const isCreator = walletAddress && deal?.created_by_wallet?.toLowerCase() === walletAddress.toLowerCase();
  const isCounterparty = isParticipant && !isCreator;

  // VIN title status polling (only when deal has a VIN)
  const { data: titleStatus } = useQuery({
    queryKey: ["title-status", deal?.vin],
    queryFn: () => fetchTitleStatus(deal!.vin!),
    enabled: Boolean(deal?.vin),
    refetchInterval: 10_000,
  });

  const titleTransferred = titleStatus?.title_status === "TRANSFERRED";

  // USDC balance check for buyer (only when they need to fund)
  const shouldCheckBalance = Boolean(publicKey) && isBuyer && deal?.status === "INIT";
  const { data: usdcBalance } = useQuery({
    queryKey: ["usdc-balance", walletAddress],
    queryFn: () => fetchUsdcBalance(connection, publicKey!),
    enabled: shouldCheckBalance,
    refetchInterval: 15_000,
  });
  const dealAmount = Number(deal?.price_usd ?? 0);
  const hasInsufficientUsdc = shouldCheckBalance && usdcBalance !== undefined && usdcBalance >= 0 && usdcBalance < dealAmount;

  const canFund = Boolean(dealId) && isBuyer && deal?.status === "INIT";
  // Escrow authorization: the OTHER party must authorize fund movement.
  // Buyer confirms delivery → server-side resolve(VERDICT_RELEASE) → seller claims from Resolution page.
  // Seller approves refund → server-side resolve(VERDICT_REFUND) → buyer claims from Resolution page.
  // DISPUTED deals must go through arbitration first. RESOLVED deals are handled on the Resolution page.
  const canConfirmDelivery = Boolean(dealId) && isBuyer && deal?.status === "FUNDED";
  const canApproveRefund = Boolean(dealId) && isSeller && deal?.status === "FUNDED";

  const events = useMemo(() => deal?.onchain_events ?? [], [deal?.onchain_events]);

  // Redirect counterparty to profile setup if they haven't set email yet
  useEffect(() => {
    if (!walletAddress || !deal || !isParticipant) return;
    const checkProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/me`, { credentials: 'include' });
        if (!res.ok) return;
        const profile = await res.json();
        if (!profile.emailAddress || !profile.displayName) {
          navigate(`/profile?returnTo=/deal/${dealId}`, { replace: true });
        }
      } catch { /* ignore */ }
    };
    checkProfile();
  }, [walletAddress, deal, isParticipant, dealId, navigate]);

  useEffect(() => {
    if (dealId) trackEvent('view_deal', { deal_id: dealId });
  }, [dealId, trackEvent]);

  const handleAction = async (actionType: 'fund' | 'confirmDelivery' | 'approveRefund') => {
    if (!dealId) return;
    setActionError(null);
    trackAction(actionType, dealId);
    try {
      switch (actionType) {
        case 'fund':
          await fundAction.mutateAsync({ dealId });
          trackDealEvent('fund_success', dealId);
          break;
        case 'confirmDelivery':
          await confirmDeliveryAction.mutateAsync({ dealId });
          trackDealEvent('confirm_delivery_success', dealId);
          break;
        case 'approveRefund':
          await approveRefundAction.mutateAsync({ dealId });
          trackDealEvent('approve_refund_success', dealId);
          break;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Action failed';
      setActionError(msg);
      trackDealEvent('action_failed', dealId, { error: msg, action_type: actionType });
    }
  };

  const handleRefresh = () => {
    trackDealEvent('deal_refresh', dealId);
    refetch();
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-32" />
              <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          {/* Status banner skeleton */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
          </Card>
          {/* Details grid skeleton */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><Skeleton className="h-6 w-24" /></CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          </div>
          {/* Description skeleton */}
          <Card>
            <CardHeader><Skeleton className="h-6 w-28" /></CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent>
          </Card>
          {/* Actions skeleton */}
          <Card>
            <CardHeader><Skeleton className="h-6 w-20" /></CardHeader>
            <CardContent className="flex gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (!isParticipant && deal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="pt-6">
              <XCircle className="w-12 h-12 mx-auto text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                You don't have permission to view this deal. Only the buyer and seller can access deal details.
              </p>
              <Link to="/deals">
                <Button variant="outline">Back to My Deals</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/deals">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Deals
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {deal?.title?.trim() || `Deal ${dealId.slice(0, 8)}...`}
              </h1>
              <p className="text-sm text-muted-foreground font-mono">{dealId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Action Error */}
        {actionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        {/* Title Transfer Alert (VIN) */}
        {deal?.vin && titleTransferred && deal.status === "FUNDED" && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Vehicle Title Transferred</p>
                  <p className="text-sm">The government has confirmed the title transfer for VIN {deal.vin}. The buyer can now release the escrow funds.</p>
                </div>
                {isBuyer && (
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 ml-4"
                    onClick={() => handleAction('confirmDelivery')}
                    disabled={confirmDeliveryAction.isPending}
                  >
                    Confirm Delivery & Release
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Contract Review Card — shown to counterparty when deal is INIT */}
        {isCounterparty && deal?.status === "INIT" && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HandshakeIcon className="w-5 h-5 text-primary" />
                Contract Review — Action Required
              </CardTitle>
              <CardDescription>
                You have been invited to participate in this escrow deal. Review the terms below.
                {isBuyer ? " Accept to lock your funds in escrow." : " Once you accept, the buyer will fund the escrow."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Deal Title</p>
                    <p className="font-semibold">{deal?.title || "Untitled Deal"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold text-lg">{formatUsd(deal?.price_usd)} USDC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{isBuyer ? "Seller" : "Buyer"}</p>
                    <p className="font-mono text-sm break-all">{isBuyer ? deal?.seller_wallet : deal?.buyer_wallet}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Deadline</p>
                    <p className="text-sm">{formatDateTime(deal?.deliver_deadline)}</p>
                  </div>
                  {deal?.vin && (
                    <div>
                      <p className="text-sm text-muted-foreground">Vehicle VIN</p>
                      <p className="font-mono text-sm">{deal.vin}</p>
                    </div>
                  )}
                </div>
                {deal?.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm whitespace-pre-wrap">{deal.description}</p>
                  </div>
                )}
              </div>

              {/* AI Contract preview within the review card */}
              {deal?.contract && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    AI-Generated Contract
                  </p>
                  <div className="bg-muted rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{deal.contract}</pre>
                  </div>
                </div>
              )}

              {isBuyer && hasInsufficientUsdc && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-semibold">Insufficient USDC Balance</p>
                    <p>
                      Your wallet has <strong>{usdcBalance?.toFixed(2) ?? "0"} USDC</strong> but this deal requires <strong>{formatUsd(deal?.price_usd)} USDC</strong>.
                      {" "}You need devnet USDC tokens (not SOL) to fund this escrow. SOL is only used for transaction fees.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {isBuyer && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    By accepting, <strong>{formatUsd(deal?.price_usd)} USDC</strong> will be transferred from your wallet to the on-chain escrow vault.
                    Funds are held securely until the deal is completed or resolved through arbitration.
                    {usdcBalance !== undefined && usdcBalance >= 0 && (
                      <span className="block mt-1 text-xs">Your USDC balance: <strong>{usdcBalance.toFixed(2)} USDC</strong></span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-2">
                {isBuyer ? (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={fundAction.isPending || hasInsufficientUsdc}
                    onClick={() => handleAction('fund')}
                  >
                    {fundAction.isPending ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                    ) : (
                      <><HandshakeIcon className="w-4 h-4 mr-2" />Accept & Fund</>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // Seller accepts — no on-chain action needed, just acknowledge
                      window.alert("Terms accepted! The buyer will now fund the escrow.");
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept Terms
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={fundAction.isPending}
                  onClick={() => {
                    if (window.confirm("Are you sure you want to decline this deal? The deal will remain open but you will navigate away.")) {
                      window.location.href = "/deals";
                    }
                  }}
                >
                  <BanIcon className="w-4 h-4 mr-2" />
                  Decline
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Creator waiting card — shown to deal creator when INIT */}
        {isCreator && deal?.status === "INIT" && (
          <Card className="border-2 border-muted">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-muted-foreground" />
                {isBuyer ? "Ready to Fund" : "Waiting for Buyer"}
              </CardTitle>
              <CardDescription>
                {isBuyer
                  ? "You created this deal. You can fund the escrow now or wait for the seller to review the terms."
                  : "You created this deal. Waiting for the buyer to review the contract and fund the escrow."}
              </CardDescription>
            </CardHeader>
            {isBuyer && (
              <CardContent className="space-y-4">
                {hasInsufficientUsdc && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold">Insufficient USDC Balance</p>
                      <p>
                        Your wallet has <strong>{usdcBalance?.toFixed(2) ?? "0"} USDC</strong> but this deal requires <strong>{formatUsd(deal?.price_usd)} USDC</strong>.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={fundAction.isPending || hasInsufficientUsdc}
                  onClick={() => handleAction('fund')}
                >
                  {fundAction.isPending ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <><DollarSign className="w-4 h-4 mr-2" />Fund Escrow</>
                  )}
                </Button>
              </CardContent>
            )}
          </Card>
        )}

        {/* Status Banner */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={`${statusColors[deal?.status ?? "INIT"]} text-white text-sm px-3 py-1`}>
                  {deal?.status ?? "LOADING"}
                </Badge>
                <span className="text-lg font-bold">{formatUsd(deal?.price_usd)}</span>
                <span className="text-muted-foreground">USDC</span>
              </div>
              {deal?.fee_bps != null && (
                <span className="text-sm text-muted-foreground">
                  Platform fee: {(deal.fee_bps / 100).toFixed(1)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deal Details */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Seller {isSeller && <Badge variant="outline" className="ml-1 text-xs">You</Badge>}</p>
                <p className="font-mono text-sm break-all">{deal?.seller_wallet ?? "..."}</p>
                {deal?.seller_profile?.display_name && (
                  <p className="text-sm text-muted-foreground mt-1">{deal.seller_profile.display_name}</p>
                )}
                {deal?.seller_email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" /> {deal.seller_email}
                  </p>
                )}
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">Buyer {isBuyer && <Badge variant="outline" className="ml-1 text-xs">You</Badge>}</p>
                <p className="font-mono text-sm break-all">{deal?.buyer_wallet ?? "..."}</p>
                {deal?.buyer?.display_name && (
                  <p className="text-sm text-muted-foreground mt-1">{deal.buyer.display_name}</p>
                )}
                {deal?.buyer_email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Mail className="w-3 h-3" /> {deal.buyer_email}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timeline & Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{formatDateTime(deal?.created_at)}</span>
              </div>
              {deal?.funded_at && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Funded</span>
                  <span className="text-sm">{formatDateTime(deal.funded_at)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Deliver by</span>
                <span className="text-sm font-medium">{formatDateTime(deal?.deliver_deadline)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Dispute window ends</span>
                <span className="text-sm">{formatDateTime(deal?.dispute_deadline)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last updated</span>
                <span className="text-sm">{formatDateTime(deal?.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {deal?.description && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{deal.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Details (from car metadata) */}
        {deal?.metadata && (deal.metadata as Record<string, unknown>).year && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="w-5 h-5" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {(deal.metadata as Record<string, unknown>).year && (
                  <div>
                    <p className="text-sm text-muted-foreground">Year / Make / Model</p>
                    <p className="font-medium">
                      {(deal.metadata as Record<string, unknown>).year}{" "}
                      {(deal.metadata as Record<string, unknown>).make}{" "}
                      {(deal.metadata as Record<string, unknown>).model}
                    </p>
                  </div>
                )}
                {(deal.metadata as Record<string, unknown>).vin && (
                  <div>
                    <p className="text-sm text-muted-foreground">VIN</p>
                    <p className="font-mono text-sm">{String((deal.metadata as Record<string, unknown>).vin)}</p>
                  </div>
                )}
                {(deal.metadata as Record<string, unknown>).odometerMiles != null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Odometer</p>
                    <p className="font-medium">{Number((deal.metadata as Record<string, unknown>).odometerMiles).toLocaleString()} mi</p>
                  </div>
                )}
                {(deal.metadata as Record<string, unknown>).deliveryType && (
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery Type</p>
                    <p className="font-medium">
                      {String((deal.metadata as Record<string, unknown>).deliveryType).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Title Status</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={(deal.metadata as Record<string, unknown>).hasTitleInHand ? "default" : "outline"}>
                      {(deal.metadata as Record<string, unknown>).hasTitleInHand ? "Title in hand" : "No title yet"}
                    </Badge>
                    {(deal.metadata as Record<string, unknown>).isSalvageTitle && (
                      <Badge variant="destructive">Salvage</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dispute Status Info — shown when deal is DISPUTED */}
        {deal?.status === "DISPUTED" && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                Dispute In Progress
              </CardTitle>
              <CardDescription>
                Funds are frozen in escrow. Neither party can withdraw until the dispute is resolved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <Badge className="bg-green-600 text-white shrink-0 mt-0.5">Done</Badge>
                  <p className="text-sm">Dispute opened on-chain — funds are locked.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <Badge className="bg-blue-600 text-white shrink-0 mt-0.5">Next</Badge>
                  <p className="text-sm">Both parties submit evidence (text, screenshots, documents) to support their case.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <Badge variant="outline" className="shrink-0 mt-0.5">Then</Badge>
                  <p className="text-sm">Either party requests AI arbitration. The AI analyzes all evidence and issues a <strong>binding verdict in 10-30 seconds</strong> — no waiting period or queue.</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Link to={`/evidence/${dealId}`}>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Submit Evidence
                  </Button>
                </Link>
                <Link to={`/dispute/${dealId}`}>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    <Shield className="w-4 h-4 mr-2" />
                    Request AI Verdict
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resolution Status — shown when deal is RESOLVED */}
        {deal?.status === "RESOLVED" && resolution && (
          <Card className={`border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                {resolution.escalated_at ? (
                  <><Gavel className="w-5 h-5" />Escalated to Human Arbitration</>
                ) : (
                  <><Brain className="w-5 h-5" />AI Verdict Issued</>
                )}
              </CardTitle>
              <CardDescription>
                {resolution.escalated_at
                  ? "The AI verdict was contested. A human arbiter is reviewing the case (24-48 hours)."
                  : resolution.accepted_at
                    ? "The losing party accepted the AI verdict. The winning party can now execute the decision."
                    : `Verdict: ${resolution.outcome}. The losing party has 24 hours to accept or escalate.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link to={`/resolution/${dealId}`}>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Brain className="w-4 h-4 mr-2" />
                  View Resolution
                </Button>
              </Link>
              <Link to={`/evidence/${dealId}`}>
                <Button variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  View Evidence
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* AI-Generated Contract — visible to both parties at every stage */}
        {deal?.contract && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-purple-600" />
                AI-Generated Contract
              </CardTitle>
              <CardDescription>
                This contract was generated by AI and agreed upon by both parties before the deal was initiated on-chain.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 max-h-[500px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{deal.contract}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIN / Vehicle Title Status */}
        {deal?.vin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Car className="w-5 h-5" />
                Vehicle Title Status
              </CardTitle>
              <CardDescription>Government title registry data (auto-refreshes every 10s)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-mono text-sm">{deal.vin}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Title Status</p>
                  {titleStatus ? (
                    <Badge className={titleTransferred ? "bg-green-600 text-white" : "bg-yellow-500 text-white"}>
                      {titleStatus.title_status}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Loading...</Badge>
                  )}
                </div>
                {titleStatus?.current_owner_wallet && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground">Current Owner</p>
                    <p className="font-mono text-sm break-all">{titleStatus.current_owner_wallet}</p>
                  </div>
                )}
                {titleStatus?.transfer_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">Transfer Date</p>
                    <p className="text-sm">{formatDateTime(titleStatus.transfer_date)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5" />
              Actions
            </CardTitle>
            <CardDescription>Actions available based on your role and deal status.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {/* Fund button hidden here when Contract Review card is shown above */}
            {canConfirmDelivery && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={confirmDeliveryAction.isPending}
                onClick={() => {
                  if (window.confirm("Are you sure you want to confirm delivery? This will authorize the release of funds to the seller. This action cannot be undone.")) {
                    handleAction('confirmDelivery');
                  }
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {confirmDeliveryAction.isPending ? "Processing..." : "Confirm Delivery & Release"}
              </Button>
            )}
            {canApproveRefund && (
              <Button
                variant="secondary"
                disabled={approveRefundAction.isPending}
                onClick={() => {
                  if (window.confirm("Are you sure you want to approve a refund? This will authorize the return of funds to the buyer. This action cannot be undone.")) {
                    handleAction('approveRefund');
                  }
                }}
              >
                {approveRefundAction.isPending ? "Processing..." : "Cancel & Approve Refund"}
              </Button>
            )}
            {deal?.status === "FUNDED" && isParticipant && (
              <Link to={`/dispute/${dealId}`}>
                <Button variant="destructive">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Open Dispute
                </Button>
              </Link>
            )}
            {deal?.status === "DISPUTED" && isParticipant && (
              <Link to={`/dispute/${dealId}`}>
                <Button variant="destructive">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Manage Dispute
                </Button>
              </Link>
            )}
            {deal?.status === "RESOLVED" && (
              <Link to={`/resolution/${dealId}`}>
                <Button variant="outline">View Resolution</Button>
              </Link>
            )}
            {deal && ["DISPUTED", "RESOLVED"].includes(deal.status) && (
              <Link to={`/evidence/${dealId}`}>
                <Button variant="outline">Manage Evidence</Button>
              </Link>
            )}
            {deal && ["RELEASED", "REFUNDED"].includes(deal.status) && (
              <Button variant="outline" onClick={() => setReceiptOpen(true)}>
                <Printer className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            )}
            {!canFund && !canConfirmDelivery && !canApproveRefund && deal?.status !== "FUNDED" && deal?.status !== "RESOLVED" && deal?.status !== "DISPUTED" && !["RELEASED", "REFUNDED"].includes(deal?.status ?? "") && (
              <p className="text-sm text-muted-foreground py-2">No actions available for the current deal status.</p>
            )}
          </CardContent>
        </Card>

        {/* On-chain Events */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>On-chain events for this deal (newest first).</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No on-chain activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {events.map((evt) => (
                  <li key={evt.id} className="rounded-lg border px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold uppercase text-sm">{evt.instruction}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatDateTime(evt.created_at)}</span>
                        <a
                          href={getExplorerUrl(evt.tx_sig)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs flex items-center gap-1"
                          onClick={() => trackDealEvent('explorer_link_click', dealId, { tx_sig: evt.tx_sig })}
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <p className="text-xs font-mono break-all text-muted-foreground mt-2">{evt.tx_sig}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Share Dialog */}
      <ShareDealDialog
        dealId={dealId}
        dealTitle={deal?.title ?? undefined}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      {/* Receipt Dialog */}
      {deal && ["RELEASED", "REFUNDED"].includes(deal.status) && (
        <ReceiptDialog
          deal={deal}
          resolution={resolution}
          open={receiptOpen}
          onOpenChange={setReceiptOpen}
        />
      )}
    </PageLayout>
  );
};

export default DealOverview;
