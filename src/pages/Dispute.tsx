import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Gavel,
  ArrowLeft,
  Brain,
  FileText,
  Loader,
  AlertTriangle,
  Shield,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEvent } from "@/hooks/useEvent";
import { useDeal } from "@/hooks/useDeals";
import { useAction } from "@/hooks/useAction";
import { useEvidenceList } from "@/hooks/useEvidence";
import { useTriggerArbitration } from "@/hooks/useResolution";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const Dispute: React.FC = () => {
  const { id: dealId } = useParams<{ id: string }>();
  const { publicKey } = useWallet();
  const { trackEvent } = useEvent();
  const navigate = useNavigate();

  const { data: deal, isLoading: dealLoading, error: dealError } = useDeal(dealId);
  const { data: evidenceData, isLoading: evidenceLoading } = useEvidenceList(
    deal?.status === "DISPUTED" || deal?.status === "RESOLVED" ? dealId : undefined
  );
  const openDisputeAction = useAction("open-dispute");
  const { mutateAsync: triggerArbitration, isPending: isArbitrating } =
    useTriggerArbitration(dealId);

  const [disputeReason, setDisputeReason] = useState("");

  const viewerWallet = publicKey?.toBase58();
  const isBuyer = deal?.buyer_wallet === viewerWallet;
  const isSeller = deal?.seller_wallet === viewerWallet;
  const isParticipant = isBuyer || isSeller;

  useEffect(() => {
    trackEvent("view_dispute", { deal_id: dealId, status: deal?.status });
  }, [trackEvent, dealId, deal?.status]);

  const handleOpenDispute = async () => {
    if (!dealId || !disputeReason.trim()) return;
    try {
      await openDisputeAction.mutateAsync({ dealId });
      trackEvent("dispute_opened", { deal_id: dealId });
    } catch {
      // error handled by useAction toast
    }
  };

  const handleTriggerArbitration = async () => {
    try {
      await triggerArbitration();
      trackEvent("arbitration_triggered", { deal_id: dealId });
      navigate(`/resolution/${dealId}`);
    } catch {
      // error handled by useTriggerArbitration toast
    }
  };

  if (dealLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <Loader className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
          <h2 className="text-xl font-semibold mb-2">Loading Deal...</h2>
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
          <Button onClick={() => navigate("/deals")}>View All Deals</Button>
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
          <Button onClick={() => navigate("/wallet-connect")}>Connect Wallet</Button>
        </div>
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">Only the buyer or seller can manage this dispute.</p>
          <Button onClick={() => navigate("/deals")}>Back to Deals</Button>
        </div>
      </div>
    );
  }

  const status = deal.status;
  const canOpenDispute = status === "FUNDED";
  const isDisputed = status === "DISPUTED";
  const isResolved = status === "RESOLVED" || status === "RELEASED" || status === "REFUNDED";

  if (!canOpenDispute && !isDisputed && !isResolved) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => navigate(`/deal/${dealId}`)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deal
          </Button>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Disputes can only be opened on funded deals. Current status: <strong>{status}</strong>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(`/deal/${dealId}`)} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deal
          </Button>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Gavel className="w-7 h-7" />
            Dispute Resolution
          </h1>
          <p className="text-muted-foreground">Deal {dealId?.slice(0, 8)}...</p>
        </div>

        {/* Deal Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Deal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Title</span>
              <span className="font-medium">{deal.title || "Untitled Deal"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-bold">${Number(deal.price_usd || 0).toLocaleString()} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge
                variant={
                  status === "DISPUTED"
                    ? "destructive"
                    : status === "RESOLVED"
                    ? "secondary"
                    : "default"
                }
              >
                {status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Role</span>
              <Badge variant="outline">{isBuyer ? "Buyer" : "Seller"}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* ── FUNDED: Open Dispute ── */}
        {canOpenDispute && (
          <Card className="mb-6 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Gavel className="w-5 h-5" />
                Open a Dispute
              </CardTitle>
              <CardDescription>
                Opening a dispute will freeze the escrow funds until resolution. The AI arbiter will
                analyze evidence from both parties.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Once a dispute is opened, both parties can submit evidence. The AI arbiter will
                  then issue a binding verdict.
                </AlertDescription>
              </Alert>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Reason for Dispute <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue clearly (e.g., goods not received, defective item, misrepresentation...)"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {disputeReason.length}/500 characters
                </p>
              </div>

              {openDisputeAction.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {openDisputeAction.error.message || "Failed to open dispute"}
                  </AlertDescription>
                </Alert>
              )}

              <ConfirmDialog
                trigger={
                  <Button
                    disabled={!disputeReason.trim() || openDisputeAction.isPending}
                    variant="destructive"
                    className="w-full"
                  >
                    {openDisputeAction.isPending ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Opening Dispute...
                      </>
                    ) : (
                      <>
                        <Gavel className="w-4 h-4 mr-2" />
                        Open Dispute
                      </>
                    )}
                  </Button>
                }
                title="Open a Dispute?"
                description="This will freeze the escrow funds and start the AI arbitration process. Both parties will be notified and can submit evidence. This action cannot be undone."
                confirmLabel="Open Dispute"
                variant="destructive"
                onConfirm={handleOpenDispute}
                disabled={!disputeReason.trim() || openDisputeAction.isPending}
              />
            </CardContent>
          </Card>
        )}

        {/* ── DISPUTED: Evidence & Arbitration ── */}
        {isDisputed && (
          <>
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                This deal is under dispute. Submit evidence below and trigger AI arbitration when
                ready.
              </AlertDescription>
            </Alert>

            {/* Evidence submitted so far */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Submitted Evidence
                  {evidenceData && (
                    <Badge variant="secondary">{evidenceData.total}</Badge>
                  )}
                </CardTitle>
                <CardDescription>Evidence submitted by both parties</CardDescription>
              </CardHeader>
              <CardContent>
                {evidenceLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading evidence...
                  </div>
                ) : evidenceData?.evidence.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No evidence submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {evidenceData?.evidence.map((e) => (
                      <div key={e.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={e.role === "buyer" ? "default" : "secondary"}>
                            {e.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(e.submitted_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{e.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Evidence CTA */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Submit Your Evidence</CardTitle>
                <CardDescription>
                  Add documentation, screenshots, or descriptions to support your case
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={`/evidence/${dealId}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    Go to Evidence Submission
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Trigger Arbitration */}
            <Card className="mb-6 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Brain className="w-5 h-5" />
                  Trigger AI Arbitration
                </CardTitle>
                <CardDescription>
                  When both parties have submitted evidence, request an AI verdict. The decision
                  will be binding.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    The AI arbiter analyzes all submitted evidence and issues a cryptographically
                    signed verdict (RELEASE or REFUND).
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleTriggerArbitration}
                  disabled={isArbitrating}
                  className="w-full"
                >
                  {isArbitrating ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Evidence...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Request AI Arbitration
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── RESOLVED/RELEASED/REFUNDED ── */}
        {isResolved && (
          <Card className="mb-6 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                Dispute Resolved
              </CardTitle>
              <CardDescription>
                The AI arbiter has issued a verdict for this deal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full">
                <Link to={`/resolution/${dealId}`}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Resolution & Execute Decision
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dispute;
