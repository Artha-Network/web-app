import { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EscrowFlowTemplate from "@/templates/EscrowFlowTemplate";
import EscrowStepLayout from "@/components/organisms/EscrowStepLayout";
import StepIndicator from "@/components/molecules/StepIndicator";
import { Brain, CheckCircle2, Loader2, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { useEscrowFlow } from "@/hooks/useEscrowFlow";
import { useWallet } from "@solana/wallet-adapter-react";

const Step2: FC = () => {
    const { data, updateData, back } = useEscrowFlow();
    const { publicKey } = useWallet();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If we already have a contract, don't regenerate unless forced (could add a regenerate button later)
        if (data.contract) return;

        const generateContract = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log("AI Request sent, waiting for response...");
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/ai/generate-contract`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: data.title,
                        role: data.role,
                        counterparty: data.counterpartyAddress,
                        amount: data.amount.toString(),
                        description: data.description,
                        deliveryDeadline: data.deliveryDeadline,
                        disputeDeadline: data.disputeWindowDays?.toString(),
                    }),
                });

                console.log("AI Response status:", response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("AI Response error text:", errorText);
                    throw new Error(`Failed to generate contract: ${response.status} ${response.statusText}`);
                }

                const result = await response.json();
                console.log("AI Response data:", result);

                if (result.source === "fallback") {
                    // Using the error state to show a persistent warning, or we could use a separate warning state.
                    // The requirement is to notify the user.
                    // Let's use the setError to show it as a yellow warning if possible, but the Alert component is styled for error.
                    // Better to just add a toast.
                    const { toast } = await import("sonner");
                    toast.warning("AI Service Busy", {
                        description: "Used fallback template. Please review the contract carefully."
                    });
                }

                updateData({
                    contract: result.contract,
                    questions: result.questions,
                });
            } catch (err) {
                console.error("AI Generation Error:", err);
                setError(`Failed to generate contract: ${err instanceof Error ? err.message : String(err)}`);
            } finally {
                setLoading(false);
            }
        };

        if (data.title && data.amount) {
            generateContract();
        }
    }, [data, updateData]);

    const handleContinue = () => {
        navigate("/escrow/step3");
    };

    return (
        <EscrowFlowTemplate userName={publicKey?.toBase58().slice(0, 8) + "..."}>
            <EscrowStepLayout progress={<StepIndicator current={2} />}>
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight">AI Contract Review</h2>
                        <p className="text-muted-foreground">
                            Our AI is analyzing your deal terms to generate a secure smart contract agreement.
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                            <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-2">
                                Retry
                            </Button>
                        </Alert>
                    )}

                    {loading ? (
                        <Card className="border-dashed">
                            <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] space-y-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <div className="text-center space-y-1">
                                    <h3 className="font-semibold text-lg">Generating Contract...</h3>
                                    <p className="text-sm text-muted-foreground">Analyzing deal terms and identifying risks</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : data.contract ? (
                        <div className="space-y-6">
                            {/* Contract Preview */}
                            <Card className="overflow-hidden">
                                <CardHeader className="bg-muted/50">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Brain className="h-5 w-5 text-purple-500" />
                                        Generated Agreement
                                    </CardTitle>
                                    <CardDescription>
                                        Review the terms generated based on your inputs.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 prose dark:prose-invert max-w-none">
                                    <ReactMarkdown>{data.contract}</ReactMarkdown>
                                </CardContent>
                            </Card>

                            {/* Clarifying Questions */}
                            {data.questions && data.questions.length > 0 && (
                                <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <AlertTitle className="text-amber-800 dark:text-amber-200">Clarification Needed</AlertTitle>
                                    <AlertDescription className="text-amber-700 dark:text-amber-300 mt-2">
                                        <p className="mb-2">The AI identified potential ambiguities. Consider updating your description in Step 1 to address these:</p>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {data.questions.map((q, i) => (
                                                <li key={i}>{q}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex justify-between pt-4">
                                <Button variant="outline" onClick={() => back(2)}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Details
                                </Button>
                                <Button onClick={handleContinue} className="bg-green-600 hover:bg-green-700">
                                    Accept & Continue <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </EscrowStepLayout>
        </EscrowFlowTemplate>
    );
};

export default Step2;
