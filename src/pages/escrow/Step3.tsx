import { FC, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EscrowFlowTemplate from "@/templates/EscrowFlowTemplate";
import EscrowStepLayout from "@/components/organisms/EscrowStepLayout";
import StepIndicator from "@/components/molecules/StepIndicator";
import { 
  CheckCircle2, 
  Shield, 
  Brain, 
  ExternalLink, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  ArrowLeft,
  Loader,
  Info
} from "lucide-react";
import { useEscrowFlow } from "@/hooks/useEscrowFlow";
import { useEvent } from "@/hooks/useEvent";
import { useWallet } from "@/hooks/useWallet";
import { useAction } from "@/hooks/useAction";
import { useDeal } from "@/hooks/useDeal";

/**
 * Step3 - AI resolution confirmation and next steps (Confirm.tsx)
 * 
 * Purpose: confirm deal creation and show next steps
 * Route: /escrow/confirm (after successful funding) OR /deal/:id (direct access)
 * Emits: view_resolution, execute_release_click, execute_refund_click, payout_success
 * Storage: display current deal status from Supabase
 * AI: show AI arbiter status, past decisions, dispute process
 * Solana: show transaction links, current escrow state
 * Links: links to evidence submission, dispute initiation
 */

const Step3: FC = () => {
  const { publicKey } = useWallet();
  const { data, back } = useEscrowFlow();
  const { trackEvent } = useEvent();
  const navigate = useNavigate();
  const { id: dealId } = useParams();
  
  // If we have a deal ID from URL, use that. Otherwise use the flow data.
  const shouldUseDealHook = !!dealId;
  const { deal, loading: dealLoading, error: dealError } = useDeal(
    shouldUseDealHook ? dealId! : undefined
  );
  
  const { execute: performAction, loading: actionLoading, error: actionError } = useAction();
  const [lastActionResult, setLastActionResult] = useState<any>(null);

  // Determine data source (URL deal or flow data)
  const displayData = shouldUseDealHook ? deal : {
    id: 'temp-' + Date.now(),
    counterpartyAddress: data.counterpartyAddress,
    amount: data.amount,
    description: data.description,
    status: 'CREATED',
    ...data
  };

  // Track page view on mount
  useEffect(() => {
    trackEvent('view_resolution', {
      deal_id: displayData?.id,
      amount: displayData?.amount,
      status: displayData?.status,
      has_ai_decision: !!displayData?.ai_resolution,
    });
  }, [trackEvent, displayData]);

  const handleAction = async (actionType: 'release' | 'refund' | 'dispute') => {
    if (!publicKey || !displayData?.id) return;

    try {
      // Track action attempt
      trackEvent(`execute_${actionType}_click`, {
        deal_id: displayData.id,
        amount: displayData.amount,
      });

      const result = await performAction({
        action: actionType,
        params: {
          dealId: displayData.id,
        }
      });

      if (result?.signature) {
        // Track successful action
        trackEvent('payout_success', {
          deal_id: displayData.id,
          action_type: actionType,
          amount: displayData.amount,
          transaction_signature: result.signature,
        });

        setLastActionResult(result);
      }
    } catch (error) {
      console.error(`${actionType} failed:`, error);
    }
  };

  const handleBack = () => {
    trackEvent('resolution_back_button_click');
    back(3);
  };

  // Show loading state for deal fetch
  if (shouldUseDealHook && dealLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card p-8 rounded-lg border">
            <Loader className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Loading Deal...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Show error state for deal fetch
  if (shouldUseDealHook && dealError) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card p-8 rounded-lg border">
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
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card p-8 rounded-lg border">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to view deal status and perform actions.
            </p>
            <Button onClick={() => navigate('/wallet-connect')}>
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EscrowFlowTemplate userName={publicKey.toBase58().slice(0, 8) + "..."}>
      <EscrowStepLayout progress={<StepIndicator current={3} />}>
        
        {/* Success Alert */}
        {lastActionResult && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Action completed successfully! 
              {lastActionResult.signature && (
                <a 
                  href={`https://explorer.solana.com/tx/${lastActionResult.signature}?cluster=${import.meta.env.VITE_SOLANA_CLUSTER || 'custom'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 underline"
                >
                  View transaction <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {actionError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Action failed: {actionError}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Deal Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Escrow Status
              </CardTitle>
              <CardDescription>
                Current state of your escrow deal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={
                  displayData?.status === 'FUNDED' ? 'default' :
                  displayData?.status === 'DISPUTED' ? 'destructive' :
                  displayData?.status === 'RESOLVED' ? 'secondary' :
                  'outline'
                }>
                  {displayData?.status || 'CREATED'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-bold text-lg">
                  ${displayData?.amount?.toLocaleString()} USDC
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Deal ID</span>
                <span className="font-mono text-sm">
                  {displayData?.id?.slice(0, 8)}...
                </span>
              </div>
              
              {displayData?.transaction_hash && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transaction</span>
                  <a 
                    href={`https://explorer.solana.com/tx/${displayData.transaction_hash}?cluster=${import.meta.env.VITE_SOLANA_CLUSTER || 'custom'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View on Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <strong>Description:</strong> {displayData?.description || "No description provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Arbitration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Arbitration
              </CardTitle>
              <CardDescription>
                Gemini-powered dispute resolution system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {displayData?.ai_resolution ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Resolution Available</span>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">
                      <strong>AI Decision:</strong> {displayData.ai_resolution.decision}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Confidence: {(displayData.ai_resolution.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Resolved on {new Date(displayData.ai_resolution.resolved_at).toLocaleString()}
                  </div>
                </div>
              ) : displayData?.status === 'DISPUTED' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">Processing Dispute</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    AI arbiter is analyzing the evidence and will provide a resolution shortly.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Standby Mode</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    AI arbitration will activate if a dispute is raised.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span>Evidence analysis</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span>Fair resolution</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span>Fast processing</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Available Actions
            </CardTitle>
            <CardDescription>
              What you can do with this escrow deal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Release Funds */}
              {(displayData?.status === 'FUNDED' || displayData?.status === 'RESOLVED') && (
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
                  <h4 className="font-medium text-sm mb-1">Release Funds</h4>
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Release escrowed funds to counterparty
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => handleAction('release')}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    {actionLoading ? <Loader className="w-3 h-3 animate-spin" /> : 'Release'}
                  </Button>
                </div>
              )}

              {/* Initiate Dispute */}
              {displayData?.status === 'FUNDED' && (
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-orange-500 mb-2" />
                  <h4 className="font-medium text-sm mb-1">Raise Dispute</h4>
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Submit evidence for AI arbitration
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => navigate(`/evidence/${displayData.id}`)}
                    className="w-full"
                  >
                    Submit Evidence
                  </Button>
                </div>
              )}

              {/* Request Refund */}
              {(displayData?.status === 'FUNDED' && displayData?.ai_resolution?.decision === 'REFUND') && (
                <div className="flex flex-col items-center p-4 border rounded-lg">
                  <DollarSign className="w-8 h-8 text-blue-500 mb-2" />
                  <h4 className="font-medium text-sm mb-1">Request Refund</h4>
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Get your funds back based on AI decision
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleAction('refund')}
                    disabled={actionLoading}
                    className="w-full"
                  >
                    {actionLoading ? <Loader className="w-3 h-3 animate-spin" /> : 'Refund'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Message */}
        <Alert className="mt-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            This deal is secured by our AI-powered arbitration system. All actions are recorded on the Solana blockchain 
            for transparency and security. Need help? Contact support or submit evidence for dispute resolution.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 dark:border-gray-800 px-0 pt-6 mt-6 bg-transparent flex justify-between">
          {!shouldUseDealHook ? (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={actionLoading}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Funding
            </Button>
          ) : (
            <div /> // Empty div for spacing
          )}
          
          <Button
            onClick={() => navigate('/deals')}
            className="flex items-center gap-2"
          >
            View All Deals
          </Button>
        </div>
      </EscrowStepLayout>
    </EscrowFlowTemplate>
  );
};

export default Step3;
