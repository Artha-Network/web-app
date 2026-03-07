import { FC, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  MessageSquare,
  Shield,
  AlertTriangle,
  Info,
  Loader,
  CheckCircle2,
  ArrowLeft,
  Brain,
  User,
  Clock,
  Eye,
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEvent } from "@/hooks/useEvent";
import { useDeal } from "@/hooks/useDeals";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageLayout from "@/components/layouts/PageLayout";
import { API_BASE } from "@/lib/config";

interface EvidenceItem {
  id: string;
  deal_id: string;
  description: string;
  mime_type: string;
  submitted_by: string;
  submitted_by_name: string | null;
  submitted_at: string;
  role: "buyer" | "seller";
}

async function fetchEvidence(dealId: string): Promise<{ evidence: EvidenceItem[]; total: number }> {
  const res = await fetch(`${API_BASE}/api/deals/${dealId}/evidence`);
  if (!res.ok) throw new Error("Failed to fetch evidence");
  return res.json();
}

const EvidencePage: FC = () => {
  const { id: dealId } = useParams();
  const { publicKey } = useWallet();
  const { trackEvent } = useEvent();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: deal, isLoading: dealLoading, error: dealError } = useDeal(dealId);
  const { data: evidenceData, isLoading: evidenceLoading } = useQuery({
    queryKey: ["evidence", dealId],
    queryFn: () => fetchEvidence(dealId!),
    enabled: Boolean(dealId),
    refetchInterval: 10_000,
  });

  const [evidenceType, setEvidenceType] = useState<"text" | "file" | "both">("text");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const walletAddress = publicKey?.toBase58();
  const isBuyer = walletAddress && deal?.buyer_wallet === walletAddress;
  const isSeller = walletAddress && deal?.seller_wallet === walletAddress;
  const isParticipant = isBuyer || isSeller;

  const evidenceList = evidenceData?.evidence ?? [];
  const buyerEvidence = evidenceList.filter((e) => e.role === "buyer");
  const sellerEvidence = evidenceList.filter((e) => e.role === "seller");

  useEffect(() => {
    if (dealId) {
      trackEvent("evidence_page_viewed", { deal_id: dealId });
    }
  }, [trackEvent, dealId]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!dealId || !publicKey) return;
    if (!description.trim() && files.length === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      if (description.trim() || evidenceType !== "file") {
        const response = await fetch(`${API_BASE}/api/deals/${dealId}/evidence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: description.trim(),
            type: "text/plain",
            wallet_address: publicKey.toBase58(),
          }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Failed to submit evidence");
        }
      }

      if (files.length > 0) {
        await Promise.all(
          files.map(async (file) => {
            const formData = new FormData();
            formData.append("file", file);
            const uploadResponse = await fetch(
              `${API_BASE}/api/deals/${dealId}/evidence/upload?wallet_address=${publicKey.toBase58()}`,
              { method: "POST", body: formData }
            );
            if (!uploadResponse.ok) {
              const err = await uploadResponse.json();
              throw new Error(err.error || `Failed to upload ${file.name}`);
            }
          })
        );
      }

      trackEvent("evidence_submitted", {
        deal_id: dealId,
        evidence_type: evidenceType,
        description_length: description.length,
        file_count: files.length,
      });

      setSubmitSuccess(true);
      setDescription("");
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ["evidence", dealId] });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (dealLoading) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 py-8 text-center">
          <Loader className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
          <h2 className="text-xl font-semibold">Loading Deal...</h2>
        </div>
      </PageLayout>
    );
  }

  if (dealError || !deal) {
    return (
      <PageLayout>
        <div className="container mx-auto px-6 py-8 text-center">
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
        <div className="container mx-auto px-6 py-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Wallet Required</h2>
          <Button onClick={() => navigate("/wallet-connect")}>Connect Wallet</Button>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <Button variant="outline" onClick={() => navigate(`/deal/${dealId}`)} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Deal
            </Button>
            <h1 className="text-3xl font-bold mb-1">Evidence & Claims</h1>
            <p className="text-muted-foreground">
              {deal.title ? `"${deal.title}"` : `Deal ${dealId?.slice(0, 8)}...`} — Both parties can view all submitted evidence.
            </p>
          </div>

          {/* Evidence Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{evidenceList.length}</p>
                <p className="text-sm text-muted-foreground">Total Evidence</p>
              </CardContent>
            </Card>
            <Card className="border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-blue-600">{buyerEvidence.length}</p>
                <p className="text-sm text-muted-foreground">From Buyer</p>
              </CardContent>
            </Card>
            <Card className="border-orange-200 dark:border-orange-800">
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-orange-600">{sellerEvidence.length}</p>
                <p className="text-sm text-muted-foreground">From Seller</p>
              </CardContent>
            </Card>
          </div>

          {/* All Evidence — visible to both parties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                All Submitted Evidence
              </CardTitle>
              <CardDescription>
                Evidence from both parties is shown here. The AI arbiter reviews all of this when making a decision.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {evidenceLoading ? (
                <div className="text-center py-6">
                  <Loader className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Loading evidence...</p>
                </div>
              ) : evidenceList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No evidence submitted yet</p>
                  <p className="text-sm mt-1">Both parties should submit evidence before requesting AI arbitration.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evidenceList.map((item) => {
                    const isFromBuyer = item.role === "buyer";
                    const isFromMe = item.submitted_by === walletAddress;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-lg border p-4 ${
                          isFromBuyer
                            ? "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800"
                            : "border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {item.submitted_by_name || item.submitted_by.slice(0, 12) + "..."}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                isFromBuyer
                                  ? "text-blue-700 border-blue-300 dark:text-blue-300 dark:border-blue-700"
                                  : "text-orange-700 border-orange-300 dark:text-orange-300 dark:border-orange-700"
                              }
                            >
                              {item.role}
                            </Badge>
                            {isFromMe && (
                              <Badge variant="secondary" className="text-xs">You</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {new Date(item.submitted_at).toLocaleString()}
                          </div>
                        </div>
                        <div className="mt-2">
                          {item.mime_type === "text/plain" ? (
                            <p className="text-sm whitespace-pre-wrap">{item.description}</p>
                          ) : (
                            <div className="flex items-center gap-2 text-sm">
                              <Upload className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">File attachment ({item.mime_type})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit New Evidence — only for participants, only when DISPUTED */}
          {isParticipant && deal.status === "DISPUTED" && (
            <>
              {submitSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Evidence submitted successfully. You can submit more or request AI arbitration.
                  </AlertDescription>
                </Alert>
              )}

              {submitError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Submit New Evidence
                  </CardTitle>
                  <CardDescription>
                    Add more evidence to strengthen your case. You can submit multiple times.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Evidence Type */}
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { key: "text" as const, icon: MessageSquare, label: "Text", desc: "Written statement" },
                        { key: "file" as const, icon: Upload, label: "Files", desc: "Documents, images" },
                        { key: "both" as const, icon: FileText, label: "Both", desc: "Text + files" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setEvidenceType(opt.key)}
                        className={`p-3 border rounded-lg text-center transition-colors ${
                          evidenceType === opt.key ? "border-primary bg-primary/10" : "border-muted"
                        }`}
                      >
                        <opt.icon className="w-6 h-6 mx-auto mb-1" />
                        <h4 className="font-medium text-sm">{opt.label}</h4>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </button>
                    ))}
                  </div>

                  {/* Text input */}
                  {(evidenceType === "text" || evidenceType === "both") && (
                    <div>
                      <Label htmlFor="evidence-description">Your Statement</Label>
                      <Textarea
                        id="evidence-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide a detailed explanation of your case, what went wrong, timeline of events..."
                        rows={5}
                        className="mt-1"
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{description.length}/2000</p>
                    </div>
                  )}

                  {/* File input */}
                  {(evidenceType === "file" || evidenceType === "both") && (
                    <div>
                      <Label htmlFor="evidence-files">Upload Files</Label>
                      <Input
                        id="evidence-files"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                        onChange={handleFileUpload}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOC, TXT, JPG, PNG, GIF — Max 10MB each</p>
                      {files.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({(file.size / 1024 / 1024).toFixed(1)} MB)
                                </span>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => removeFile(index)}>
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || (!description.trim() && files.length === 0)}
                      className="min-w-[140px]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Submit Evidence
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Non-DISPUTED status info */}
          {deal.status !== "DISPUTED" && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Evidence submission is {deal.status === "RESOLVED" ? "closed — the AI has already issued a verdict" : `not available in ${deal.status} status`}.
                {deal.status === "RESOLVED" && (
                  <Button variant="link" className="p-0 h-auto ml-1" onClick={() => navigate(`/resolution/${dealId}`)}>
                    View Resolution
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* AI Arbitration CTA */}
          {deal.status === "DISPUTED" && isParticipant && (
            <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Brain className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="font-semibold">Ready for AI Arbitration?</p>
                      <p className="text-sm text-muted-foreground">
                        Once both parties have submitted evidence, request an instant AI verdict (10-30 seconds).
                      </p>
                    </div>
                  </div>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 shrink-0"
                    onClick={() => navigate(`/dispute/${dealId}`)}
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    Request AI Verdict
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default EvidencePage;
