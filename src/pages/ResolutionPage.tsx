import { FC, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  CheckCircle2,
  AlertTriangle,
  Shield,
  ExternalLink,
  Clock,
  DollarSign,
  ArrowLeft,
  Loader,
  FileText,
  Info
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEvent } from "@/hooks/useEvent";
import { useDeal, useResolution } from "@/hooks/useDeals";
import { useAction } from "@/hooks/useAction";

/**
 * Resolution Display Page
 * Route: /resolution/:id
 * Purpose: Display AI arbitration resolution and allow execution
 * Emits: view_ai_resolution, execute_ai_decision
 * Storage: resolution data from Supabase
 * AI: display AI arbiter decision, reasoning, confidence
 * Solana: execute resolution on-chain
 */

const ResolutionPage: FC = () => {
  const { id: dealId } = useParams();
  const { publicKey } = useWallet();
  const { trackEvent } = useEvent();
  const navigate = useNavigate();

  const { data: deal, isLoading: dealLoading, error: dealError } = useDeal(dealId);
  const { data: resolution, isLoading: resolutionLoading } = useResolution(dealId);
  const { mutateAsync: executeResolution, isPending: isExecuting, error: executeError } = useAction('release');

  // Track page view on mount
  useEffect(() => {
    trackEvent('view_resolution', {
      deal_id: dealId,
      amount: deal?.price_usd ? Number(deal.price_usd) : undefined,
      status: deal?.status,
    });
  }, [trackEvent, dealId, deal?.price_usd, deal?.status]);

  const handleExecuteResolution = async (action: 'release' | 'refund') => {
    if (!dealId || !publicKey) return;

    try {
      // Track execution attempt
      trackEvent('execute_ai_decision', {
        deal_id: dealId,
        decision: action,
        amount: deal?.price_usd ? Number(deal.price_usd) : undefined,
      });

      const result = await executeResolution({
        dealId,
      });

      if (result?.dealId) {
        // Navigate back to deal overview
        navigate(`/deal/${dealId}`);
      }
    } catch (error) {
      console.error('Resolution execution failed:', error);
    }
  };

  // Show loading state
  if (dealLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <Loader className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Loading Resolution...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (dealError || !deal) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Deal Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The requested deal could not be found.
            </p>
            <Button onClick={() => navigate('/deals')}>
              View All Deals
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show wallet connection requirement
  if (!publicKey) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to view the resolution.
            </p>
            <Button onClick={() => navigate('/wallet-connect')}>
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const decision = resolution?.outcome ?? null;
  const confidence = resolution?.confidence ?? 0;
  const reasoning = resolution?.rationale_cid ?? "";
  const resolvedAt = resolution?.issued_at ?? null;

  // Show "awaiting resolution" when no resolution ticket exists yet
  if (!resolutionLoading && !resolution && deal) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate(`/deal/${dealId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deal
          </Button>
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Awaiting Resolution</h2>
            <p className="text-muted-foreground">
              The AI arbiter has not yet issued a resolution for this deal.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/deal/${dealId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Deal
          </Button>

          <h1 className="text-3xl font-bold mb-2">AI Arbitration Resolution</h1>
          <p className="text-muted-foreground">
            Final decision for deal {dealId?.slice(0, 8)}...
          </p>
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
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-bold">${deal.price_usd ? Number(deal.price_usd).toLocaleString() : '0'} USDC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={deal.status === 'DISPUTED' ? 'destructive' : deal.status === 'RESOLVED' ? 'secondary' : 'default'}>
                {deal.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span className="text-sm">{new Date(deal.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {executeError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Resolution execution failed: {executeError?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {/* AI Resolution */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Arbitration Decision
            </CardTitle>
            <CardDescription>
              Powered by Gemini 1.5 Pro with advanced reasoning
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
                    {decision === 'RELEASE' ? 'Release Funds' : 'Refund Buyer'}
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
                AI Reasoning
              </h4>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm leading-relaxed">
                  {reasoning}
                </p>
              </div>
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Resolution completed on {new Date(resolvedAt || new Date().toISOString()).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Action Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Execute Decision</CardTitle>
            <CardDescription>
              Execute the AI arbitration decision on the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This action will execute the AI arbitration decision on the Solana blockchain.
                  Once executed, the decision is final and cannot be reversed.
                </AlertDescription>
              </Alert>

              <div className="flex justify-center">
                {decision === 'RELEASE' ? (
                  <Button
                    onClick={() => handleExecuteResolution('release')}
                    disabled={isExecuting}
                    className="min-w-[160px]"
                    size="lg"
                  >
                    {isExecuting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Release Funds
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleExecuteResolution('refund')}
                    disabled={isExecuting}
                    className="min-w-[160px]"
                    size="lg"
                    variant="outline"
                  >
                    {isExecuting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Process Refund
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appeal Process */}
        <Card>
          <CardHeader>
            <CardTitle>Dispute This Decision</CardTitle>
            <CardDescription>
              If you disagree with this resolution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                AI arbitration decisions are designed to be fair and final. However, if you believe
                there was an error in the analysis, you can:
              </p>

              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Contact our support team for a human review</li>
                <li>Provide additional evidence that wasn't considered</li>
                <li>Request clarification on the reasoning</li>
              </ul>

              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View Terms
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResolutionPage;