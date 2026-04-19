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
  Scale,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useDeal, useResolution } from "@/hooks/useDeals";
import { useAction } from "@/hooks/useAction";
import PageLayout from "@/components/layouts/PageLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE } from "@/lib/config";
import { formatDateTime, formatUsd, shortAddress } from "@/utils/format";

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

  const shell = (content: React.ReactNode) => (
    <PageLayout>
      <div className="relative overflow-hidden bg-background min-h-screen">
        <div className="orb top-24 -right-16 w-[280px] h-[280px] bg-destructive/15" />
        <div className="orb top-[380px] -left-20 w-[220px] h-[220px] bg-accent/15" style={{ animationDelay: "1.4s" }} />
        <div className="relative container mx-auto max-w-3xl px-6 py-10 space-y-6">{content}</div>
      </div>
    </PageLayout>
  );

  if (dealLoading) {
    return shell(
      <>
        <div>
          <Skeleton className="h-9 w-32 mb-4" />
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Card className="glass-card">
          <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </>,
    );
  }

  if (dealError || !deal) {
    return shell(
      <div className="glass-card p-10 text-center">
        <div className="icon-tile mx-auto mb-4" style={{ background: "hsl(var(--destructive))" }}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Deal Not Found</h2>
        <p className="text-sm text-muted-foreground mb-5">We couldn't locate this dispute.</p>
        <Button onClick={() => navigate("/deals")} className="rounded-full">View All Deals</Button>
      </div>,
    );
  }

  if (!publicKey) {
    return shell(
      <div className="glass-card p-10 text-center">
        <div className="icon-tile mx-auto mb-4">
          <Shield className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
        <p className="text-sm text-muted-foreground mb-5">Connect your wallet to participate in this dispute.</p>
        <Button onClick={() => navigate("/wallet-connect")} className="rounded-full">Connect Wallet</Button>
      </div>,
    );
  }

  return shell(
    <>
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(`/deal/${dealId}`)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to deal
        </button>
        <span className="artha-pill artha-pill-destructive mb-3">
          <Scale className="w-3.5 h-3.5" />
          Dispute resolution
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight mb-1">
          Resolve this <span className="gradient-text-two">dispute</span>.
        </h1>
        <p className="text-muted-foreground">
          {deal.title ? `"${deal.title}"` : `Deal ${dealId?.slice(0, 8)}…`} · {formatUsd(deal.price_usd)} USDC
        </p>
      </div>

      {/* Deal Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Deal Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Amount</p>
            <p className="font-bold text-lg font-mono-data">{formatUsd(deal.price_usd)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Status</p>
            <Badge variant={deal.status === "DISPUTED" ? "destructive" : "secondary"} className="mt-0.5">
              {deal.status}
            </Badge>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Buyer</p>
            <p className="font-mono-data text-sm truncate">
              {shortAddress(deal.buyer_wallet)} {isBuyer && <span className="text-primary">(You)</span>}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Seller</p>
            <p className="font-mono-data text-sm truncate">
              {shortAddress(deal.seller_wallet)} {isSeller && <span className="text-primary">(You)</span>}
            </p>
          </div>
          {deal.deliver_deadline && (
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Deadline</p>
              <p className="text-sm">{formatDateTime(deal.deliver_deadline)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verdict issued — show summary + link */}
      {deal.status === "RESOLVED" && resolution && (
        <div className="gradient-hero-card p-6 relative">
          <div className="absolute inset-0 grid-overlay-light" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-[11px] font-semibold tracking-wider uppercase mb-3">
              <CheckCircle2 className="w-3 h-3" /> Verdict issued
            </span>
            <div className="text-xl font-bold leading-tight mb-2">
              Outcome: {resolution.outcome}
            </div>
            <p className="text-sm opacity-85 mb-4">
              Confidence: {(resolution.confidence * 100).toFixed(0)}% · The losing party has 24 hours to accept or escalate.
            </p>
            <Button onClick={() => navigate(`/resolution/${dealId}`)} className="bg-white text-primary hover:bg-white/90 rounded-full font-bold">
              <ExternalLink className="w-4 h-4 mr-2" />
              View full resolution
            </Button>
          </div>
        </div>
      )}

      {/* AI Contract — reference for both parties during dispute */}
      {deal.contract && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary" />
              AI-Generated Contract
            </CardTitle>
            <CardDescription>
              The original terms both parties agreed to. The AI arbiter uses this as the baseline for its verdict.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 max-h-[400px] overflow-y-auto border border-border/60">
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
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-primary-custom">1</div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Open Dispute on Solana
                </CardTitle>
                <CardDescription className="mt-1">
                  {deal.status === "DISPUTED"
                    ? "Dispute is already open. Funds are frozen in escrow — neither party can withdraw."
                    : "Freeze escrow funds and begin the arbitration process."}
                </CardDescription>
              </div>
            </div>
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
                    className="rounded-full"
                  >
                    {disputePending ? (
                      <><Loader className="w-4 h-4 mr-2 animate-spin" />Opening…</>
                    ) : (
                      <><AlertTriangle className="w-4 h-4 mr-2" />Open Dispute</>
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
              <div className="flex items-center gap-2 text-sm text-[hsl(var(--success))]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Dispute opened successfully. Proceed to submit evidence.</span>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Step 2: Submit Evidence */}
      {(deal.status === "DISPUTED" || deal.status === "FUNDED") && (
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-primary-custom">2</div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Submit Evidence
                </CardTitle>
                <CardDescription className="mt-1">
                  Provide written statements, screenshots, or documents supporting your case.
                  Both parties can submit evidence — the AI reviews everything from both sides.
                  {deal.status !== "DISPUTED" && " (Available once dispute is opened)"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to={`/evidence/${dealId}`}>
              <Button variant="outline" disabled={deal.status !== "DISPUTED"} className="rounded-full">
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
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm shadow-secondary-custom">3</div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-secondary" />
                  Request AI Arbitration
                </CardTitle>
                <CardDescription className="mt-1">
                  Once both parties have submitted evidence, request the AI arbiter to analyze and issue a verdict.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {arbitrateError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{arbitrateError}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-xl p-4 space-y-2 bg-secondary/5 border border-secondary/20">
              <h4 className="font-semibold text-sm">What happens when you click "Request AI Verdict":</h4>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
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
              className="bg-gradient-secondary text-secondary-foreground hover:opacity-90 rounded-full font-bold shadow-secondary-custom"
            >
              {isArbitrating ? (
                <><Loader className="w-4 h-4 mr-2 animate-spin" />Analyzing Evidence (10-30s)…</>
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
    </>
  );
};

export default Dispute;
