import React, { useMemo, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDeal } from "@/hooks/useDeals";
import { useAction } from "@/hooks/useAction";
import { useEvent } from "@/hooks/useEvent";
import PageLayout from "@/components/layouts/PageLayout";
import {
  ArrowLeft,
  ExternalLink,
  Clock,
  User,
  DollarSign,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

/**
 * DealOverview - The hub page with a single next action
 * 
 * Purpose: the hub page with a single next action
 * Emits: view_deal, action_click_{fund|confirm|dispute|resolve}
 * Storage: reads/writes deal_status, deadlines
 * AI: none
 * Solana (read): EscrowState PDA, vault ATA, last tx sigs
 * Links: Buyer next: /escrow/fund/:id or /escrow/confirm/:id or /dispute/:id
 *        Evidence: /evidence/:id
 *        Resolution: /resolution/:id
 *        Explorer links for each tx
 */

import { formatDateTime, formatUsd, getExplorerUrl } from "@/utils/format";

/**
 * DealOverview - The hub page with a single next action
 * 
 * Purpose: the hub page with a single next action
 * Emits: view_deal, action_click_{fund|confirm|dispute|resolve}
 * Storage: reads/writes deal_status, deadlines
 * AI: none
 * Solana (read): EscrowState PDA, vault ATA, last tx sigs
 * Links: Buyer next: /escrow/fund/:id or /escrow/confirm/:id or /dispute/:id
 *        Evidence: /evidence/:id
 *        Resolution: /resolution/:id
 *        Explorer links for each tx
 */

const DealOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dealId = id ?? "";
  const { publicKey } = useWallet();
  const { trackEvent, trackAction, trackDealEvent } = useEvent();
  const walletAddress = publicKey?.toBase58();

  const { data: deal, isLoading, refetch } = useDeal(dealId);
  const fundAction = useAction("fund");
  const releaseAction = useAction("release");
  const refundAction = useAction("refund");

  const isBuyer = walletAddress && deal?.buyer_wallet?.toLowerCase() === walletAddress.toLowerCase();
  const isSeller = walletAddress && deal?.seller_wallet?.toLowerCase() === walletAddress.toLowerCase();
  const isParticipant = isBuyer || isSeller;



  const canFund = Boolean(dealId) && isBuyer && deal?.status === "INIT";
  const canRelease = Boolean(dealId) && isBuyer && deal && ["FUNDED", "RESOLVED"].includes(deal.status);
  const canRefund = Boolean(dealId) && isSeller && deal && ["FUNDED", "RESOLVED"].includes(deal.status);

  const events = useMemo(() => deal?.onchain_events ?? [], [deal?.onchain_events]);

  // Track page view on mount
  useEffect(() => {
    if (dealId) {
      trackEvent('view_deal', { deal_id: dealId });
    }
  }, [dealId, trackEvent]);

  const handleAction = async (actionType: 'fund' | 'release' | 'refund') => {
    if (!dealId) return;

    trackAction(actionType, dealId);

    try {
      switch (actionType) {
        case 'fund':
          await fundAction.mutateAsync({ dealId });
          trackDealEvent('fund_success', dealId);
          break;
        case 'release':
          await releaseAction.mutateAsync({ dealId });
          trackDealEvent('payout_success', dealId, { payout_type: 'release' });
          break;
        case 'refund':
          await refundAction.mutateAsync({ dealId });
          trackDealEvent('payout_success', dealId, { payout_type: 'refund' });
          break;
      }
    } catch (error) {
      trackDealEvent('fund_failed', dealId, {
        error: error instanceof Error ? error.message : 'Unknown error',
        action_type: actionType
      });
    }
  };

  const handleRefresh = () => {
    trackDealEvent('deal_refresh', dealId);
    refetch();
  };

  // Get next action for user
  const getNextAction = () => {
    if (!deal || !isParticipant) return null;

    if (deal.status === "INIT" && isBuyer) {
      return {
        type: 'fund',
        label: 'Fund Escrow',
        description: 'Transfer USDC to escrow to secure this deal',
        link: `/escrow/fund/${dealId}`,
        variant: 'default' as const
      };
    }

    if (deal.status === "FUNDED" && isBuyer) {
      return {
        type: 'confirm',
        label: 'Confirm Receipt',
        description: 'Confirm you received the goods/services and release payment',
        action: () => handleAction('release'),
        variant: 'default' as const
      };
    }

    if (deal.status === "FUNDED" && (isBuyer || isSeller)) {
      return {
        type: 'dispute',
        label: 'Open Dispute',
        description: 'If there\'s an issue, open a dispute for AI arbitration',
        link: `/dispute/${dealId}`,
        variant: 'destructive' as const
      };
    }

    if (deal.status === "RESOLVED") {
      return {
        type: 'view_resolution',
        label: 'View Resolution',
        description: 'Check the AI arbitration decision',
        link: `/resolution/${dealId}`,
        variant: 'outline' as const
      };
    }

    return null;
  };

  const nextAction = getNextAction();

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
                {deal?.title && deal.title.trim() ? deal.title.trim() : `Deal ${id.slice(0, 8)}...`}
              </h1>
              <p className="text-muted-foreground">Deal ID: {id}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Next Action Card */}
        {nextAction && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary" />
                Next Action Required
              </CardTitle>
              <CardDescription>
                {nextAction.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nextAction.link ? (
                <Link to={nextAction.link}>
                  <Button
                    variant={nextAction.variant}
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    {nextAction.label}
                  </Button>
                </Link>
              ) : nextAction.action ? (
                <Button
                  variant={nextAction.variant}
                  size="lg"
                  onClick={nextAction.action}
                  disabled={
                    (nextAction.type === 'fund' && fundAction.isPending) ||
                    (nextAction.type === 'confirm' && releaseAction.isPending)
                  }
                  className="w-full sm:w-auto"
                >
                  {nextAction.label}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Deal Details */}
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <CardTitle>Deal Details</CardTitle>
            <CardDescription>Live data fetched from Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Status
              </p>
              <Badge className="mt-1 uppercase">{deal?.status ?? "loading"}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Amount
              </p>
              <p className="font-semibold">{formatUsd(deal?.price_usd)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                Buyer {isBuyer && "(You)"}
              </p>
              <p className="font-mono text-sm break-all">{deal?.buyer_wallet ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                Seller {isSeller && "(You)"}
              </p>
              <p className="font-mono text-sm break-all">{deal?.seller_wallet ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Deliver by
              </p>
              <p>{formatDateTime(deal?.deliver_deadline)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last updated
              </p>
              <p>{formatDateTime(deal?.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* All Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Available Actions</CardTitle>
            <CardDescription>Actions available based on your role and deal status.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              disabled={!canFund || fundAction.isPending}
              onClick={() => handleAction('fund')}
              variant={canFund ? "default" : "outline"}
            >
              Fund Escrow
            </Button>
            <Button
              variant="outline"
              disabled={!canRelease || releaseAction.isPending}
              onClick={() => handleAction('release')}
            >
              Release Funds
            </Button>
            <Button
              variant="secondary"
              disabled={!canRefund || refundAction.isPending}
              onClick={() => handleAction('refund')}
            >
              Refund Buyer
            </Button>

            <Link to={`/dispute/${dealId}`}>
              <Button variant="destructive" disabled={!deal || !["INIT", "FUNDED"].includes(deal.status)}>
                Open Dispute
              </Button>
            </Link>

            <Link to={`/evidence/${dealId}`}>
              <Button variant="outline">
                Manage Evidence
              </Button>
            </Link>
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
              <p className="text-sm text-muted-foreground">Loading events…</p>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No on-chain activity recorded yet.</p>
            ) : (
              <ul className="space-y-3">
                {events.map((evt) => (
                  <li key={evt.id} className="rounded-lg border border-gray-200 px-4 py-3">
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
                          View
                          <ExternalLink className="w-3 h-3" />
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
    </PageLayout>
  );
};

export default DealOverview;
