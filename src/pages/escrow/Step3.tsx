import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import EscrowFlowTemplate from "@/templates/EscrowFlowTemplate";
import EscrowStepLayout from "@/components/organisms/EscrowStepLayout";
import StepIndicator from "@/components/molecules/StepIndicator";
import { ArrowRight, ArrowLeft, Shield, Clock, DollarSign, CheckCircle2, Info, AlertTriangle, Loader } from "lucide-react";
import { useEscrowFlow } from "@/hooks/useEscrowFlow";
import { useEvent } from "@/hooks/useEvent";
import { useWallet } from "@/hooks/useWallet";
import { useAction } from "@/hooks/useAction";

/**
 * Step2 - Fund deal and deploy to Solana (Fund.tsx)
 * 
 * Purpose: fund deal
 * Route: /escrow/fund/:id  (where :id is temporary local ID)
 * Emits: fund_attempt, fund_success, fund_failed
 * Storage: update deal status to FUNDED
 * AI: none yet
 * Solana: Initialize escrow PDA, fund vault
 * Links: /deal/:deal_id (the actual blockchain deal_id from response)
 */

const Step2: FC = () => {
  const { publicKey } = useWallet();
  const { data, back, next } = useEscrowFlow();
  const { trackEvent } = useEvent();
  const navigate = useNavigate();
  const { mutate: initiateEscrow, isPending: isInitiating, error: initiateError } = useAction("initiate");
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Track page view on mount
  useEffect(() => {
    trackEvent('view_funding', {
      amount: data.amount,
      counterparty: data.counterpartyAddress,
      funding_method: data.fundingMethod,
    });
  }, [data.amount, data.counterpartyAddress, data.fundingMethod, trackEvent]);

  // Calculate fees and totals
  const platformFeeRate = 0.005; // 0.5%
  const platformFee = typeof data.amount === 'number' ? Number((data.amount * platformFeeRate).toFixed(2)) : 0;
  const gasFee = 0.01; // Estimated SOL for transaction fees
  const totalCost = typeof data.amount === 'number' ? Number((data.amount + platformFee).toFixed(2)) : 0;

  // Format dates for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleFunding = async () => {
    if (!publicKey) {
      console.error('Wallet not connected');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Track funding attempt
      trackEvent('fund_attempt', {
        amount: data.amount,
        platform_fee: platformFee,
        total_cost: totalCost,
      });

      // Convert dates to timestamps
      const deliverBy = data.deliveryDeadline ? new Date(data.deliveryDeadline).getTime() / 1000 : undefined;
      const disputeDeadline = data.completionDeadline ? new Date(data.completionDeadline).getTime() / 1000 : undefined;

      // Create and initiate the escrow (this includes both creation and funding)
      initiateEscrow({
        counterparty: data.counterpartyAddress,
        amount: typeof data.amount === 'number' ? data.amount : 0,
        description: data.description,
        deliverBy,
        disputeDeadline,
        feeBps: 50, // 0.5% fee (50 basis points)
      }, {
        onSuccess: (result) => {
          // Track successful funding
          trackEvent('fund_success', {
            deal_id: result.dealId,
            amount: data.amount,
            platform_fee: platformFee,
            transaction_signature: result.txSig,
          });

          // Store the blockchain deal ID
          localStorage.setItem('lastCreatedDealId', result.dealId);

          // Navigate to deal overview
          navigate(`/deal/${result.dealId}`);
        },
        onError: (error) => {
          console.error('Funding failed:', error);
          trackEvent('fund_failed', {
            error: error.message,
            amount: data.amount,
          });
        },
        onSettled: () => {
          setIsProcessing(false);
        }
      });

    } catch (error) {
      console.error('Funding failed:', error);
      trackEvent('fund_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        amount: data.amount,
      });
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    trackEvent('fund_back_button_click');
    back(2);
  };

  // Show wallet connection requirement
  if (!publicKey) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-card p-8 rounded-lg border">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to fund the escrow deal.
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
    <EscrowFlowTemplate>
      <EscrowStepLayout
        headerTitle="Fund Your Deal"
        headerSubtitle="Review the details and fund your escrow to deploy it on Solana"
        progress={<StepIndicator current={2} />}
        footer={
          <div className="flex gap-4 pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
              disabled={isInitiating || isProcessing}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Setup
            </Button>
            
            <Button
              onClick={handleFunding}
              className="flex-1"
              disabled={isInitiating || isProcessing}
            >
              {isInitiating || isProcessing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Creating Deal...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Fund Deal (${totalCost.toFixed(2)} USDC)
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Deal Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Deal Summary
              </CardTitle>
              <CardDescription>
                Review your escrow details before funding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Counterparty</Label>
                  <p className="font-mono text-sm break-all bg-muted p-2 rounded">
                    {data.counterpartyAddress}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="text-lg font-semibold">${data.amount} USDC</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Delivery Deadline</Label>
                  <p>{formatDate(data.deliveryDeadline)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Completion Deadline</Label>
                  <p>{formatDate(data.completionDeadline)}</p>
                </div>
              </div>
              
              {data.description && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                  <p className="text-sm bg-muted p-3 rounded">{data.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Fee Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Deal Amount</span>
                  <span className="font-medium">${data.amount} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee (0.5%)</span>
                  <span className="font-medium">${platformFee.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span>Gas Fee (estimated)</span>
                  <span className="font-medium">~{gasFee} SOL</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total USDC Cost</span>
                    <span>${totalCost.toFixed(2)} USDC</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Funding Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Funding Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  {data.fundingMethod}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Funds will be held securely in an on-chain escrow vault
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <div>
                    <p className="font-medium">Deal Creation</p>
                    <p className="text-sm text-muted-foreground">Now</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="font-medium">Delivery Deadline</p>
                    <p className="text-sm text-muted-foreground">{formatDate(data.deliveryDeadline)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                  <div>
                    <p className="font-medium">Completion Deadline</p>
                    <p className="text-sm text-muted-foreground">{formatDate(data.completionDeadline)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Secure Escrow:</strong> Your funds will be held in a Solana smart contract. 
              Neither party can access the funds until the deal is completed or resolved through arbitration.
            </AlertDescription>
          </Alert>

          {/* Error Display */}
          {initiateError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Failed to create escrow: {initiateError.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {(isInitiating || isProcessing) && (
            <Alert>
              <Loader className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Creating your escrow deal on Solana. Please approve the transaction in your wallet...
              </AlertDescription>
            </Alert>
          )}
        </div>
      </EscrowStepLayout>
    </EscrowFlowTemplate>
  );
};

export default Step2;