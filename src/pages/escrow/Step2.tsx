import { FC, useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/config";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PageLayout from "@/components/layouts/PageLayout";
import StepIndicator from "@/components/molecules/StepIndicator";
import { Brain, Loader2, AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { useEscrowFlow } from "@/hooks/useEscrowFlow";

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

const Step2: FC = () => {
  const { data, updateData, back } = useEscrowFlow();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const lastCallAtRef = useRef(0);

  const generateContract = async () => {
    // Guard 1: a request is already in flight — block duplicates from StrictMode double-mount or rage-clicks.
    if (inFlightRef.current) return;
    // Guard 2: client-side cooldown so the user can't burn credits by spamming Regenerate.
    const now = Date.now();
    if (now - lastCallAtRef.current < 5_000) {
      setError("Please wait a few seconds before regenerating.");
      return;
    }
    lastCallAtRef.current = now;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    updateData({ contract: "", questions: [] });
    try {
      const response = await fetch(`${API_BASE}/api/ai/generate-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(65_000),
        body: JSON.stringify({
          title: data.title,
          role: data.role,
          counterparty: data.counterpartyAddress,
          amount: data.amount.toString(),
          description: data.description,
          initiatorDeadline: data.initiatorDeadline,
          completionDeadline: data.completionDeadline,
          deliveryDeadline: data.completionDeadline || data.deliveryDeadline,
          disputeDeadline: data.disputeWindowDays?.toString(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Response error text:", errorText);
        throw new Error(`Failed to generate contract: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.source === "fallback") {
        const { toast } = await import("sonner");
        toast.warning("AI Service Busy", {
          description: "Used fallback template. Please review the contract carefully.",
        });
      }

      updateData({ contract: result.contract, questions: result.questions });
    } catch (err) {
      console.error("AI Generation Error:", err);
      setError(`Failed to generate contract: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (!data.title || !data.amount) {
      navigate("/escrow/step1");
      return;
    }
    if (data.contract) return;
    generateContract();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleContinue = () => {
    navigate("/escrow/step3");
  };

  return (
    <Shell>
      {/* Hero */}
      <div className="text-center mb-8">
        <span className="artha-pill-secondary">
          <Sparkles className="w-3.5 h-3.5" />
          Step 2 · AI contract review
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
          Your <span className="gradient-text-two">AI-drafted</span> agreement
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Our AI is analyzing your deal terms to generate a secure smart contract agreement.
        </p>
      </div>

      {/* Progress */}
      <Card className="glass-card mb-6">
        <CardContent className="px-6 py-5">
          <StepIndicator current={2} />
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6 glass-card border-destructive/40">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <Button variant="outline" size="sm" onClick={generateContract} className="mt-3">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </Alert>
      )}

      {loading ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center min-h-[320px] space-y-4 py-10">
            <div className="icon-tile icon-tile-secondary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-lg">Generating contract...</h3>
              <p className="text-sm text-muted-foreground">Analyzing deal terms and identifying risks</p>
            </div>
          </CardContent>
        </Card>
      ) : data.contract ? (
        <div className="space-y-6">
          {/* Contract preview */}
          <Card className="glass-card overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-border/60">
              <div className="icon-tile icon-tile-secondary h-10 w-10 rounded-xl">
                <Brain className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">Generated agreement</h2>
                <p className="text-sm text-muted-foreground">Review the terms generated based on your inputs.</p>
              </div>
              <span className="artha-pill-accent">
                <CheckCircle2 className="w-3.5 h-3.5" />
                AI drafted
              </span>
            </div>
            <CardContent className="p-6 sm:p-8 prose dark:prose-invert max-w-none">
              <ReactMarkdown>{data.contract}</ReactMarkdown>
            </CardContent>
          </Card>

          {/* Clarifying questions */}
          {data.questions && data.questions.length > 0 && (
            <Alert className="glass-card border-amber-500/40 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-900 dark:text-amber-200">Clarification needed</AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200 mt-2">
                <p className="mb-2">
                  The AI identified potential ambiguities. Consider updating your description in Step 1 to address these:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {data.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                updateData({ contract: "", questions: [] });
                back(2);
              }}
              className="rounded-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to details
            </Button>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={generateContract} disabled={loading} className="rounded-full">
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
              </Button>
              <Button
                onClick={handleContinue}
                className="bg-gradient-primary text-white rounded-full px-8 shadow-primary-custom hover:opacity-95"
              >
                Accept & continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
};

export default Step2;
