import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageLayout from "@/components/layouts/PageLayout";
import StepIndicator from "@/components/molecules/StepIndicator";
import {
  ArrowLeft,
  Shield,
  Clock,
  DollarSign,
  CheckCircle2,
  Info,
  AlertTriangle,
  Loader,
  Sparkles,
  Lock,
} from "lucide-react";
import { useEscrowFlow } from "@/hooks/useEscrowFlow";
import { useEvent } from "@/hooks/useEvent";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { useAction } from "@/hooks/useAction";
import { shortAddress } from "@/utils/format";

const MIN_SOL_FOR_INITIATE = 0.01;

const Shell: FC<{ children: React.ReactNode }> = ({ children }) => (
  <PageLayout>
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="orb bg-primary/20 h-72 w-72 -top-20 -left-20" />
      <div className="orb bg-secondary/15 h-96 w-96 top-1/3 -right-32" style={{ animationDelay: "1s" }} />
      <div className="orb bg-accent/15 h-80 w-80 bottom-0 left-1/2" style={{ animationDelay: "2s" }} />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 py-10">{children}</div>
    </div>
  </PageLayout>
);

const Step3: FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { data, back, reset } = useEscrowFlow();
  const { trackEvent } = useEvent();
  const navigate = useNavigate();
  const { mutate: initiateEscrow, isPending: isInitiating, error: initiateError } = useAction("initiate");

  const [isProcessing, setIsProcessing] = useState(false);

  const { data: solBalance } = useQuery<number>({
    queryKey: ["sol-balance", publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return 0;
      const lamports = await connection.getBalance(publicKey, "confirmed");
      return lamports / LAMPORTS_PER_SOL;
    },
    enabled: Boolean(publicKey),
    refetchInterval: 20_000,
    staleTime: 10_000,
  });

  const hasInsufficientSol = typeof solBalance === "number" && solBalance < MIN_SOL_FOR_INITIATE;

  useEffect(() => {
    trackEvent("view_funding", {
      amount: data.amount,
      counterparty: data.counterpartyAddress,
      funding_method: data.fundingMethod,
    });
  }, [data.amount, data.counterpartyAddress, data.fundingMethod, trackEvent]);

  const platformFeeRate = 0.005;
  const platformFee = typeof data.amount === "number" ? Number((data.amount * platformFeeRate).toFixed(2)) : 0;
  const gasFee = 0.01;
  const totalCost = typeof data.amount === "number" ? Number((data.amount + platformFee).toFixed(2)) : 0;

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleFunding = async () => {
    if (!publicKey) {
      console.error("Wallet not connected");
      return;
    }

    setIsProcessing(true);

    try {
      trackEvent("fund_attempt", {
        amount: data.amount,
        platform_fee: platformFee,
        total_cost: totalCost,
      });

      const deliverBy = data.completionDeadline ? Math.floor(new Date(data.completionDeadline).getTime() / 1000) : undefined;
      const DISPUTE_WINDOW_DAYS = data.vin ? 5 : 7;
      const disputeDeadline = data.completionDeadline
        ? Math.floor(new Date(data.completionDeadline).getTime() / 1000) + DISPUTE_WINDOW_DAYS * 24 * 60 * 60
        : undefined;

      const isBuyer = data.role === "buyer";
      const buyerEmail = isBuyer ? data.userEmail || undefined : data.counterpartyEmail?.trim() || undefined;
      const sellerEmail = isBuyer ? data.counterpartyEmail?.trim() || undefined : data.userEmail || undefined;

      initiateEscrow(
        {
          counterparty: data.counterpartyAddress,
          amount: typeof data.amount === "number" ? data.amount : 0,
          description: data.description,
          title: data.title?.trim() || undefined,
          deliverBy,
          disputeDeadline,
          feeBps: 50,
          role: data.role,
          buyerEmail,
          sellerEmail,
          vin: data.vin?.trim() || undefined,
          contract: data.contract || undefined,
          metadata: data.isCarSale
            ? {
                year: data.carMetadata?.year,
                make: data.carMetadata?.make,
                model: data.carMetadata?.model,
                vin: data.vin,
                odometerMiles: data.carMetadata?.odometerMiles,
                deliveryType: data.carMetadata?.deliveryType,
                hasTitleInHand: data.carMetadata?.hasTitleInHand,
                isSalvageTitle: data.carMetadata?.isSalvageTitle,
              }
            : undefined,
        },
        {
          onSuccess: async (result) => {
            if (!result.txSig) {
              console.error("Initiate succeeded but no transaction signature received");
              trackEvent("fund_failed", {
                error: "No transaction signature from initiate",
                amount: data.amount,
              });
              return;
            }

            trackEvent("fund_success", {
              deal_id: result.dealId,
              amount: data.amount,
              platform_fee: platformFee,
              transaction_signature: result.txSig,
            });

            localStorage.setItem("lastCreatedDealId", result.dealId);
            reset();
            navigate(`/deal/${result.dealId}`);
          },
          onError: (error) => {
            console.error("Funding failed:", error);
            trackEvent("fund_failed", { error: error.message, amount: data.amount });
          },
          onSettled: () => {
            setIsProcessing(false);
          },
        }
      );
    } catch (error) {
      console.error("Funding failed:", error);
      trackEvent("fund_failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        amount: data.amount,
      });
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    trackEvent("fund_back_button_click");
    back(2);
  };

  if (!publicKey) {
    return (
      <Shell>
        <div className="mx-auto max-w-xl">
          <Card className="glass-card">
            <CardContent className="p-10 text-center">
              <div className="icon-tile mx-auto mb-5">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Wallet required</h2>
              <p className="text-muted-foreground mb-6">Connect your wallet to fund the escrow deal.</p>
              <Button className="bg-gradient-primary text-white rounded-full" onClick={() => navigate("/wallet-connect")}>
                Connect wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* Hero */}
      <div className="text-center mb-8">
        <span className="artha-pill-secondary">
          <Sparkles className="w-3.5 h-3.5" />
          Step 3 · Review & fund
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
          Fund your <span className="gradient-text-two">escrow</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Review the details and fund your escrow to deploy it on Solana.
        </p>
      </div>

      {/* Progress */}
      <Card className="glass-card mb-6">
        <CardContent className="px-6 py-5">
          <StepIndicator current={3} />
        </CardContent>
      </Card>

      {/* Feature hero: total summary */}
      <Card className="gradient-hero-card mb-6 border-0">
        <CardContent className="relative p-6 sm:p-8">
          <div className="grid-overlay-light absolute inset-0" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-white text-xs mb-3">
                <Lock className="w-3.5 h-3.5" />
                On-chain escrow
              </div>
              <h2 className="text-white/90 text-sm">{data.title || "Untitled deal"}</h2>
              <div className="text-white text-4xl font-bold tracking-tight mt-1 font-mono-data">
                ${totalCost.toFixed(2)} <span className="text-lg font-medium opacity-80">USDC</span>
              </div>
              <p className="text-white/80 text-sm mt-1">
                Deal ${typeof data.amount === "number" ? data.amount : 0} + ${platformFee.toFixed(2)} platform fee
              </p>
            </div>
            <div className="text-right text-white/80 text-sm space-y-1">
              <div className="flex items-center gap-2 justify-end">
                <CheckCircle2 className="w-4 h-4" />
                <span>Funds held in PDA vault</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Shield className="w-4 h-4" />
                <span>Released on completion or arbitration</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* Deal summary */}
        <Card className="glass-card">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-tile h-10 w-10 rounded-xl">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Deal summary</h2>
                <p className="text-sm text-muted-foreground">Review your escrow details before funding.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Counterparty</Label>
                <p className="font-mono-data text-sm break-all bg-muted/50 p-2 rounded mt-1">
                  {data.counterpartyAddress}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{shortAddress(data.counterpartyAddress)}</p>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Amount</Label>
                <p className="text-lg font-semibold font-mono-data mt-1">
                  ${typeof data.amount === "number" ? data.amount : 0} USDC
                </p>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Delivery deadline</Label>
                <p className="mt-1">{formatDate(data.completionDeadline)}</p>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Your role</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="capitalize">
                    {data.role}
                  </Badge>
                </div>
              </div>
            </div>

            {data.description && (
              <div className="mt-4">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
                <p className="text-sm bg-muted/40 p-3 rounded mt-1">{data.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee breakdown */}
        <Card className="glass-card">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-tile icon-tile-secondary h-10 w-10 rounded-xl">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Fee breakdown</h2>
                <p className="text-sm text-muted-foreground">Protocol cost plus on-chain gas.</p>
              </div>
            </div>

            <div className="space-y-3 font-mono-data text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deal amount</span>
                <span>${typeof data.amount === "number" ? data.amount : 0} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee (0.5%)</span>
                <span>${platformFee.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gas fee (estimated)</span>
                <span>~{gasFee} SOL</span>
              </div>
              <div className="border-t border-border/60 pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total USDC cost</span>
                  <span className="gradient-text-two">${totalCost.toFixed(2)} USDC</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Funding method */}
        <Card className="glass-card">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-tile h-10 w-10 rounded-xl">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Funding method</h2>
                <p className="text-sm text-muted-foreground">Funds are held in an on-chain escrow vault.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="artha-pill">{data.fundingMethod}</span>
              <span className="text-sm text-muted-foreground">
                Funds will be held securely in an on-chain escrow vault.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card className="glass-card">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="icon-tile icon-tile-secondary h-10 w-10 rounded-xl">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Timeline</h2>
                <p className="text-sm text-muted-foreground">Key deal milestones.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-3 h-3 rounded-full bg-[hsl(var(--success))] shadow-[0_0_0_4px_hsl(var(--success)/0.2)]" />
                <div>
                  <p className="font-medium">Deal creation</p>
                  <p className="text-sm text-muted-foreground">Now</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 w-3 h-3 rounded-full bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.2)]" />
                <div>
                  <p className="font-medium">Delivery deadline</p>
                  <p className="text-sm text-muted-foreground">{formatDate(data.completionDeadline)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security notice */}
        <Alert className="glass-card border-primary/30">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>Secure escrow:</strong> Your funds will be held in a Solana smart contract. Neither party can access the
            funds until the deal is completed or resolved through arbitration.
          </AlertDescription>
        </Alert>

        {hasInsufficientSol && (
          <Alert variant="destructive" className="glass-card border-destructive/40">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Insufficient SOL:</strong> Your wallet has {solBalance?.toFixed(4)} SOL. Creating an escrow requires at
              least {MIN_SOL_FOR_INITIATE} SOL to cover account rent and transaction fees. Fund your wallet with SOL before
              continuing.
            </AlertDescription>
          </Alert>
        )}

        {initiateError && (
          <Alert variant="destructive" className="glass-card border-destructive/40">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Failed to create escrow: {initiateError.message}</AlertDescription>
          </Alert>
        )}

        {(isInitiating || isProcessing) && (
          <Alert className="glass-card border-primary/30">
            <Loader className="h-4 w-4 animate-spin text-primary" />
            <AlertDescription>
              Creating your escrow deal on Solana. Please approve the transaction in your wallet...
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between mt-8">
        <Button
          variant="outline"
          onClick={handleBack}
          className="rounded-full"
          disabled={isInitiating || isProcessing}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to review
        </Button>

        <Button
          onClick={handleFunding}
          className="bg-gradient-primary text-white rounded-full px-8 h-11 shadow-primary-custom hover:opacity-95 transition-all"
          disabled={isInitiating || isProcessing || hasInsufficientSol}
        >
          {isInitiating || isProcessing ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Creating deal...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4 mr-2" />
              Fund deal (${totalCost.toFixed(2)} USDC)
            </>
          )}
        </Button>
      </div>
    </Shell>
  );
};

export default Step3;
