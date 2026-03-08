import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Brain,
  ArrowLeft,
  FileText,
  Loader,
  Shield,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDeal, useResolution } from "@/hooks/useDeals";
import { useAction } from "@/hooks/useAction";
import PageLayout from "@/components/layouts/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE } from "@/lib/config";
import { formatDateTime, formatUsd } from "@/utils/format";

/**
 * Dispute Resolution Page
 * Route: /dispute/:id
 * Purpose: Open a dispute, submit evidence, request AI arbitration
 */
const Dispute: React.FC = () => {
  const { id: dealId } = useParams<{ id: string }>();
  const { publicKey } = useWallet();
  const navigate = useNavigate();

  const { data: deal, isLoading: dealLoading, error: dealError } = useDeal(dealId);
  const { data: resolution } = useResolution(
    deal?.status === "RESOLVED" || deal?.status === "DISPUTED" ? dealId : undefined
  );
  const { mutateAsync: openDispute, isPending: disputePending } = useAction("openDispute");

  const [isArbitrating, setIsArbitrating] = useState(false);
  const [arbitrateError, setArbitrateError] = useState<string | null>(null);

  const walletAddress = publicKey?.toBase58();
  const isBuyer = walletAddress && deal?.buyer_wallet === walletAddress;
  const isSeller = walletAddress && deal?.seller_wallet === walletAddress;
  const isParticipant = isBuyer || isSeller;

  const handleOpenDispute = async () => {
    if (!dealId) return;
    try {
      await openDispute({ dealId });
    } catch {
      // error shown via useAction's built-in error state
    }
  };

  const handleArbitrate = async () => {
    if (!dealId) return;
    setIsArbitrating(true);
    setArbitrateError(null);
    try {
      const res = await fetch(`${API_BASE}/api/deals/${dealId}/arbitrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || `Arbitration failed (${res.status})`);
      }
      navigate(`/resolution/${dealId}`);
    } catch (err) {
      setArbitrateError(err instanceof Error ? err.message : "Arbitration request failed");
    } finally {
      setIsArbitrating(false);
    }
  };

  if (dealLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 space-y-6 max-w-3xl">
          <div>
            <Skeleton className="h-9 w-32 mb-4" />
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-40" />
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    );
  }

  if (dealError || !deal) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Deal Not Found</h2>
          <Button onClick={() => navigate("/deals")}>View All Deals</Button>
        </div>
      </PageLayout>
    );
  }

  if (!publicKey) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
          <Button onClick={() => navigate("/wallet-connect")}>Connect Wallet</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 space-y-6 max-w-3xl">
        {/* Header */}
        <div>
          <Button variant="outline" size="sm" onClick={() => navigate(`/deal/${dealId}`)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deal
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Dispute Resolution</h1>
          <p className="text-muted-foreground mt-1">
            {deal.title ? `"${deal.title}"` : `Deal ${dealId?.slice(0, 8)}...`}
          </p>
        </div>

        {/* Deal Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Deal Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Amount</p>
              <p className="font-semibold">{formatUsd(deal.price_usd)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={deal.status === "DISPUTED" ? "destructive" : "secondary"} className="mt-0.5">
                {deal.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Buyer</p>
              <p className="font-mono text-sm truncate">
                {deal.buyer_wallet?.slice(0, 20)}... {isBuyer && "(You)"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Seller</p>
              <p className="font-mono text-sm truncate">
                {deal.seller_wallet?.slice(0, 20)}... {isSeller && "(You)"}
              </p>
            </div>
            {deal.deliver_deadline && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="text-sm">{formatDateTime(deal.deliver_deadline)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Verdict issued — show summary + link */}
        {deal.status === "RESOLVED" && resolution && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                AI Verdict Issued
              </CardTitle>
              <CardDescription>
                Outcome: <strong>{resolution.outcome}</strong> — Confidence:{" "}
                {(resolution.confidence * 100).toFixed(0)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate(`/resolution/${dealId}`)}>
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Resolution &amp; Execute Verdict
              </Button>
            </CardContent>
          </Card>
        )}

        {/* AI Contract — reference for both parties during dispute */}
        {deal.contract && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                AI-Generated Contract
              </CardTitle>
              <CardDescription>
                The original terms both parties agreed to. The AI arbiter uses this as the baseline for its verdict.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 max-h-[400px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{deal.contract}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How Dispute Resolution Works */}
        {deal.status === "FUNDED" && (
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-1">How Dispute Resolution Works</p>
              <p className="text-sm">
                Opening a dispute freezes the escrow funds on-chain. Both parties can then submit evidence
                (text, screenshots, documents). Once evidence is submitted, either party can request an <strong>instant AI verdict</strong> —
                the AI analyzes all evidence in <strong>10-30 seconds</strong> and issues a RELEASE or REFUND decision. The winning party can
                execute immediately. The losing party has <strong>24 hours</strong> to accept or escalate to a human arbiter.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Open Dispute */}
        {(deal.status === "FUNDED" || deal.status === "DISPUTED") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Step 1 — Open Dispute on Solana
              </CardTitle>
              <CardDescription>
                {deal.status === "DISPUTED"
                  ? "Dispute is already open. Funds are frozen in escrow — neither party can withdraw."
                  : "Freeze escrow funds and begin the arbitration process."}
              </CardDescription>
            </CardHeader>
            {deal.status === "FUNDED" && (
              <CardContent className="space-y-3">
                {!isParticipant ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Only the buyer or seller can open a dispute.</AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleOpenDispute}
                      disabled={disputePending}
                    >
                      {disputePending ? (
                        <><Loader className="w-4 h-4 mr-2 animate-spin" />Opening...</>
                      ) : (
                        "Open Dispute"
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      This will create an on-chain dispute transaction. Funds remain locked until resolution.
                    </p>
                  </>
                )}
              </CardContent>
            )}
            {deal.status === "DISPUTED" && (
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Dispute opened successfully. Proceed to submit evidence.</span>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Step 2: Submit Evidence */}
        {(deal.status === "DISPUTED" || deal.status === "FUNDED") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Step 2 — Submit Evidence
              </CardTitle>
              <CardDescription>
                Provide written statements, screenshots, or documents supporting your case.
                Both parties can submit evidence — the AI reviews everything from both sides.
                {deal.status !== "DISPUTED" && " (Available once dispute is opened)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={`/evidence/${dealId}`}>
                <Button variant="outline" disabled={deal.status !== "DISPUTED"}>
                  <FileText className="w-4 h-4 mr-2" />
                  Submit Evidence
                </Button>
              </Link>
              {deal.status === "DISPUTED" && (
                <p className="text-xs text-muted-foreground">
                  Tip: Be specific. Include dates, screenshots of conversations, delivery receipts, or any proof
                  that supports your position. The more evidence you provide, the better the AI can judge.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: AI Arbitration */}
        {deal.status === "DISPUTED" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Step 3 — Request AI Arbitration
              </CardTitle>
              <CardDescription>
                Once both parties have submitted evidence, request the AI arbiter to analyze and issue a verdict.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {arbitrateError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{arbitrateError}</AlertDescription>
                </Alert>
              )}

              <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm text-purple-800 dark:text-purple-200">What happens when you click "Request AI Verdict":</h4>
                <ul className="text-xs text-purple-700 dark:text-purple-300 list-disc list-inside space-y-1">
                  <li>The AI reads all evidence submitted by both parties</li>
                  <li>It analyzes the deal terms, deadlines, and claims</li>
                  <li>A verdict is issued in <strong>10-30 seconds</strong> (no waiting period)</li>
                  <li>The verdict is either <strong>RELEASE</strong> (pay seller) or <strong>REFUND</strong> (return to buyer)</li>
                  <li>The winning party can execute immediately — the losing party has <strong>24 hours</strong> to accept or escalate to a human arbiter</li>
                </ul>
              </div>

              <Button
                onClick={handleArbitrate}
                disabled={!isParticipant || isArbitrating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isArbitrating ? (
                  <><Loader className="w-4 h-4 mr-2 animate-spin" />Analyzing Evidence (10-30s)...</>
                ) : (
                  <><Brain className="w-4 h-4 mr-2" />Request AI Verdict</>
                )}
              </Button>

              {isArbitrating && (
                <Alert>
                  <Loader className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    The AI arbiter is reviewing all evidence. This typically takes <strong>10-30 seconds</strong>.
                    Please don't close this page — you'll be redirected to the resolution once the verdict is ready.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default Dispute;
