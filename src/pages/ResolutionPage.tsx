import { FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Clock,
  DollarSign,
  ArrowLeft,
  Loader,
  FileText,
  Info,
  Timer,
  UserCheck,
  Gavel,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEvent } from "@/hooks/useEvent";
import { useDeal, useResolution } from "@/hooks/useDeals";
import { useAction } from "@/hooks/useAction";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/lib/config";

const ResolutionPage: FC = () => {
  const { id: dealId } = useParams();
  const { publicKey } = useWallet();
  const { trackEvent } = useEvent();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: deal, isLoading: dealLoading, error: dealError } = useDeal(dealId);
  const { data: resolution, isLoading: resolutionLoading } = useResolution(dealId);
  const { mutateAsync: executeRelease, isPending: isReleasePending, error: releaseError } = useAction('release');
  const { mutateAsync: executeRefund, isPending: isRefundPending, error: refundError } = useAction('refund');
  const isExecuting = isReleasePending || isRefundPending;
  const executeError = releaseError ?? refundError;

  const [isAccepting, setIsAccepting] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [showEscalateForm, setShowEscalateForm] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  const viewerWallet = publicKey?.toBase58();
  const isBuyer = deal?.buyer_wallet === viewerWallet;
  const isSeller = deal?.seller_wallet === viewerWallet;

  const decision = resolution?.outcome ?? null;
  const confidence = resolution?.confidence ?? 0;
  const rawReasoning = resolution?.rationale_cid ?? "";
  const reasoning = rawReasoning === "pending" ? "" : rawReasoning;
  const resolvedAt = resolution?.issued_at ?? null;
  const expiresAt = resolution?.expires_at ?? null;
  const acceptedAt = resolution?.accepted_at ?? null;
  const escalatedAt = resolution?.escalated_at ?? null;
  const source = resolution?.source ?? 'AI';

  const isHumanVerdict = source === 'HUMAN';
  const isVoluntary = source === 'BUYER_CONFIRMED' || source === 'SELLER_VOLUNTARY';
  const isLosingParty =
    (decision === 'RELEASE' && isBuyer) ||
    (decision === 'REFUND' && isSeller);
  const isWinningParty =
    (decision === 'RELEASE' && isSeller) ||
    (decision === 'REFUND' && isBuyer);

  // Winning party can always execute immediately. Losing party must wait for acceptance/expiry.
  // Voluntary resolutions (confirm delivery / approve refund) have acceptedAt pre-set, so they're always finalized.
  const windowExpired = expiresAt ? new Date() > new Date(expiresAt) : false;
  const verdictFinalized = isHumanVerdict || isVoluntary || !!acceptedAt || windowExpired;
  const canExecute = !escalatedAt && (isWinningParty || verdictFinalized);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt || acceptedAt || escalatedAt || isHumanVerdict) {
      setTimeLeft("");
      return;
    }
    const update = () => {
      const now = Date.now();
      const end = new Date(expiresAt).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${mins}m ${secs}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, acceptedAt, escalatedAt, isHumanVerdict]);

  useEffect(() => {
    trackEvent('view_resolution', {
      deal_id: dealId,
      amount: deal?.price_usd ? Number(deal.price_usd) : undefined,
      status: deal?.status,
    });
  }, [trackEvent, dealId, deal?.price_usd, deal?.status]);

  // Auto-execute: when winning party visits and verdict is finalized, auto-trigger the tx
  const [autoExecuted, setAutoExecuted] = useState(false);
  useEffect(() => {
    if (autoExecuted || !canExecute || !isWinningParty || !dealId || !publicKey || isExecuting) return;
    if (!decision || escalatedAt) return;
    // Only auto-trigger if deal is still RESOLVED (not already RELEASED/REFUNDED)
    if (deal?.status !== 'RESOLVED') return;
    setAutoExecuted(true);
    const action = decision === 'RELEASE' ? 'release' : 'refund';
    setActionMsg({ type: 'success', text: `Verdict finalized — auto-initiating ${action}. Please approve the transaction in your wallet.` });
    handleExecuteResolution(action);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canExecute, isWinningParty, dealId, publicKey, decision, escalatedAt, deal?.status, autoExecuted, isExecuting]);

  const handleExecuteResolution = async (action: 'release' | 'refund') => {
    if (!dealId || !publicKey) return;
    setActionMsg(null);
    try {
      trackEvent('execute_ai_decision', { deal_id: dealId, decision: action });
      const result = action === 'refund'
        ? await executeRefund({ dealId })
        : await executeRelease({ dealId });
      if (result?.dealId) navigate(`/deal/${dealId}`);
    } catch (error) {
      console.error('Resolution execution failed:', error);
    }
  };

  const handleAccept = async () => {
    if (!dealId || !viewerWallet) return;
    setIsAccepting(true);
    setActionMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/deals/${dealId}/accept-verdict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: viewerWallet }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to accept verdict');
      }
      setActionMsg({ type: 'success', text: 'Verdict accepted. The winning party can now execute the decision.' });
      queryClient.invalidateQueries({ queryKey: ['resolution', dealId] });
    } catch (err) {
      setActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to accept' });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleEscalate = async () => {
    if (!dealId || !viewerWallet) return;
    setIsEscalating(true);
    setActionMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/deals/${dealId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: viewerWallet, reason: escalateReason.trim() || undefined }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to escalate');
      }
      setActionMsg({ type: 'success', text: 'Escalated to human arbitration. A human arbiter will review within 24-48 hours.' });
      queryClient.invalidateQueries({ queryKey: ['resolution', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
    } catch (err) {
      setActionMsg({ type: 'error', text: err instanceof Error ? err.message : 'Failed to escalate' });
    } finally {
      setIsEscalating(false);
      setShowEscalateForm(false);
    }
  };

  // Loading / error / wallet states
  if (dealLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <Loader className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
          <h2 className="text-xl font-semibold">Loading Resolution...</h2>
        </div>
      </div>
    );
  }
  if (dealError || !deal) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Deal Not Found</h2>
          <Button onClick={() => navigate('/deals')}>View All Deals</Button>
        </div>
      </div>
    );
  }
  if (!publicKey) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
          <Button onClick={() => navigate('/wallet-connect')}>Connect Wallet</Button>
        </div>
      </div>
    );
  }
  if (!resolutionLoading && !resolution) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => navigate(`/deal/${dealId}`)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Deal
          </Button>
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Awaiting Resolution</h2>
            <p className="text-muted-foreground">The AI arbiter has not yet issued a resolution.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <Button variant="outline" onClick={() => navigate(`/deal/${dealId}`)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Deal
          </Button>
          <h1 className="text-3xl font-bold mb-2">
            {source === 'BUYER_CONFIRMED' ? 'Buyer Confirmed Delivery'
              : source === 'SELLER_VOLUNTARY' ? 'Seller Approved Refund'
              : isHumanVerdict ? 'Human Arbitration Resolution'
              : 'AI Arbitration Resolution'}
          </h1>
          <p className="text-muted-foreground">
            {deal.title ? `"${deal.title}"` : `Deal ${dealId?.slice(0, 8)}...`}
          </p>
        </div>

        {/* Action messages */}
        {actionMsg && (
          <Alert variant={actionMsg.type === 'error' ? 'destructive' : 'default'}
            className={actionMsg.type === 'success' ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : ''}>
            {actionMsg.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
            <AlertDescription>{actionMsg.text}</AlertDescription>
          </Alert>
        )}

        {/* Escalated banner */}
        {escalatedAt && (
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/30">
            <Gavel className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <p className="font-semibold">Escalated to Human Arbitration</p>
              <p className="text-sm">
                The AI verdict was contested on {new Date(escalatedAt).toLocaleString()}.
                A human arbiter is reviewing the case. Expected resolution: 24-48 hours.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* 24hr countdown banner -- only for AI verdict, not yet accepted/escalated */}
        {!isHumanVerdict && !acceptedAt && !escalatedAt && timeLeft && timeLeft !== "Expired" && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Timer className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-800 dark:text-blue-200">Review Window</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      The losing party has 24 hours to accept or escalate to human arbitration.
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-600 text-white text-lg px-4 py-1 font-mono">
                  {timeLeft}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Window expired -- auto-finalized */}
        {!isHumanVerdict && !acceptedAt && !escalatedAt && timeLeft === "Expired" && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              The 24-hour review window has expired. The AI verdict is now final and can be executed.
            </AlertDescription>
          </Alert>
        )}

        {/* Accepted banner */}
        {acceptedAt && !escalatedAt && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <UserCheck className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <p className="font-semibold">Verdict Accepted</p>
              <p className="text-sm">
                The losing party accepted the AI verdict on {new Date(acceptedAt).toLocaleString()}.
                The winning party can now execute the decision on-chain.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Deal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Deal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-bold">${deal.price_usd ? Number(deal.price_usd).toLocaleString() : '0'} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={deal.status === 'DISPUTED' ? 'destructive' : 'secondary'}>{deal.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Role</span>
              <span className="text-sm font-medium">
                {isBuyer ? 'Buyer' : isSeller ? 'Seller' : 'Observer'}
                {isWinningParty && <Badge className="ml-2 bg-green-600 text-white text-xs">Winning Party</Badge>}
                {isLosingParty && <Badge className="ml-2 bg-orange-600 text-white text-xs">Losing Party</Badge>}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Execution error */}
        {executeError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Execution failed: {executeError?.message || 'Unknown error'}</AlertDescription>
          </Alert>
        )}

        {/* AI/Human Resolution Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isHumanVerdict ? <Gavel className="w-5 h-5" /> : <Brain className="w-5 h-5" />}
              {isHumanVerdict ? 'Human Arbitration Decision' : 'AI Arbitration Decision'}
            </CardTitle>
            <CardDescription>
              {isHumanVerdict ? 'Reviewed by a qualified human arbiter -- this decision is final.' : 'Powered by Claude with advanced reasoning'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Decision */}
            <div className="text-center p-6 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-3 mb-3">
                {decision === 'RELEASE' ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <DollarSign className="w-8 h-8 text-blue-600" />
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {decision === 'RELEASE' ? 'Release Funds to Seller' : 'Refund to Buyer'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Confidence: {(confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              {decision === 'RELEASE' ? (
                <p className="text-sm text-green-700 dark:text-green-300">
                  The seller has fulfilled their obligations. Funds should be released.
                </p>
              ) : (
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  The buyer's claim is valid. A refund should be processed.
                </p>
              )}
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {isHumanVerdict ? 'Arbiter Reasoning' : 'AI Reasoning'}
              </h4>
              <div className="bg-muted p-4 rounded-lg">
                {reasoning ? (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{reasoning}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Detailed reasoning was not recorded for this arbitration. The verdict was based on the evidence and contract terms provided.
                  </p>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Resolution issued on {new Date(resolvedAt || new Date().toISOString()).toLocaleString()}
                {isHumanVerdict && ' (Human Arbiter)'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* AI Contract reference */}
        {deal.contract && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Original Contract
              </CardTitle>
              <CardDescription>The terms both parties agreed to before the deal was initiated.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{deal.contract}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Losing Party Actions -- Accept or Escalate (only for AI verdict, within window) */}
        {isLosingParty && !isHumanVerdict && !acceptedAt && !escalatedAt && !windowExpired && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="w-5 h-5" />
                The AI Ruled Against You
              </CardTitle>
              <CardDescription>
                You have {timeLeft} to respond. If you take no action, the verdict becomes final when the window expires.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="bg-green-600 hover:bg-green-700 flex-1"
                  onClick={handleAccept}
                  disabled={isAccepting || isEscalating}
                >
                  {isAccepting ? (
                    <><Loader className="w-4 h-4 mr-2 animate-spin" />Accepting...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4 mr-2" />Accept Verdict</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-950/50 flex-1"
                  onClick={() => setShowEscalateForm(!showEscalateForm)}
                  disabled={isAccepting || isEscalating}
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  Escalate to Human Arbiter
                </Button>
              </div>

              {showEscalateForm && (
                <div className="space-y-3 border-t pt-4">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-sm text-amber-800 dark:text-amber-200">What happens when you escalate:</h4>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 list-disc list-inside space-y-1">
                      <li>A qualified human arbiter reviews all evidence, the AI verdict, and the original contract</li>
                      <li>The human arbiter has full access to all deal data</li>
                      <li>Expected review time: <strong>24-48 hours</strong></li>
                      <li>The human verdict is <strong>final and binding</strong> — it overrides the AI decision and cannot be appealed</li>
                    </ul>
                  </div>
                  <Textarea
                    value={escalateReason}
                    onChange={(e) => setEscalateReason(e.target.value)}
                    placeholder="Why do you disagree with the AI verdict? (optional but recommended)"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      onClick={handleEscalate}
                      disabled={isEscalating}
                    >
                      {isEscalating ? (
                        <><Loader className="w-4 h-4 mr-2 animate-spin" />Escalating...</>
                      ) : (
                        'Confirm Escalation'
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setShowEscalateForm(false)} disabled={isEscalating}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Winning Party info — losing party still has time to escalate */}
        {isWinningParty && !verdictFinalized && !escalatedAt && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The other party has {timeLeft} to accept or escalate to human arbitration.
              You can execute the decision now, but note they may still escalate.
            </AlertDescription>
          </Alert>
        )}

        {/* Execute Decision -- only when finalized */}
        {canExecute && (
          <Card>
            <CardHeader>
              <CardTitle>Execute Decision</CardTitle>
              <CardDescription>
                {isHumanVerdict
                  ? "Execute the human arbiter's final decision on the blockchain."
                  : acceptedAt
                    ? 'The losing party accepted the verdict. Execute the decision on-chain.'
                    : 'The review window has expired. The verdict is now final.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    This action will transfer funds on the Solana blockchain. Once executed, it cannot be reversed.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center">
                  {decision === 'RELEASE' && isSeller && (
                    <Button
                      onClick={() => handleExecuteResolution('release')}
                      disabled={isExecuting}
                      className="min-w-[160px]"
                      size="lg"
                    >
                      {isExecuting ? (
                        <><Loader className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 mr-2" />Claim Funds</>
                      )}
                    </Button>
                  )}
                  {decision === 'RELEASE' && isBuyer && (
                    <Alert className="max-w-md">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        The verdict ruled in favor of the seller. The seller will claim the funds.
                      </AlertDescription>
                    </Alert>
                  )}
                  {decision === 'REFUND' && isBuyer && (
                    <Button
                      onClick={() => handleExecuteResolution('refund')}
                      disabled={isExecuting}
                      className="min-w-[160px]"
                      size="lg"
                      variant="outline"
                    >
                      {isExecuting ? (
                        <><Loader className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                      ) : (
                        <><DollarSign className="w-4 h-4 mr-2" />Claim Refund</>
                      )}
                    </Button>
                  )}
                  {decision === 'REFUND' && isSeller && (
                    <Alert className="max-w-md">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        The verdict ruled in favor of the buyer. The buyer will claim their refund.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ResolutionPage;
