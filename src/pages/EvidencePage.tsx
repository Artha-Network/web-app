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
  Camera, 
  MessageSquare, 
  Shield, 
  AlertTriangle, 
  Info, 
  Loader,
  CheckCircle2,
  ArrowLeft,
  Brain
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useEvent } from "@/hooks/useEvent";
import { useDeal } from "@/hooks/useDeal";
import { useAction } from "@/hooks/useAction";

/**
 * Evidence Submission Page
 * Route: /evidence/:id
 * Purpose: Submit evidence for AI arbitration
 * Emits: evidence_submission_started, evidence_file_uploaded, evidence_submitted
 * Storage: evidence records in Supabase
 * AI: evidence submitted to AI arbiter for analysis
 * Solana: dispute status updated on-chain
 */

const EvidencePage: FC = () => {
  const { id: dealId } = useParams();
  const { publicKey } = useWallet();
  const { trackEvent } = useEvent();
  const navigate = useNavigate();
  
  const { data: deal, isLoading: dealLoading, error: dealError } = useDeal(dealId);
  const { mutateAsync: submitEvidence, isPending: isSubmitting, error: submitError } = useAction('initiate');

  const [evidenceType, setEvidenceType] = useState<'text' | 'file' | 'both'>('text');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Track page view on mount
  useEffect(() => {
    trackEvent('evidence_submission_started', {
      deal_id: dealId,
      amount: deal?.price_usd ? Number(deal.price_usd) : undefined,
    });
  }, [trackEvent, dealId, deal?.price_usd]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    
    // Track file upload
    selectedFiles.forEach(file => {
      trackEvent('evidence_file_uploaded', {
        deal_id: dealId,
        file_type: file.type,
        file_size: file.size,
      });
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!dealId || !publicKey) return;

    if (!description.trim() && files.length === 0) {
      return; // Need at least description or files
    }

    try {
      setIsUploading(true);

      // Submit evidence to AI arbiter
      const result = await submitEvidence({
        counterparty: deal.buyer_wallet || deal.seller_wallet || '',
        amount: Number(deal.price_usd || 0),
        description: `Evidence submission: ${description.trim()}`,
      });

      if (result?.dealId) {
        // Track successful submission
        trackEvent('evidence_submitted', {
          deal_id: dealId,
          evidence_type: evidenceType,
          description_length: description.length,
          file_count: files.length,
        });

        // Navigate back to deal overview
        navigate(`/deal/${dealId}`);
      }
    } catch (error) {
      console.error('Evidence submission failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Show loading state
  if (dealLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <Loader className="w-12 h-12 mx-auto text-muted-foreground mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Loading Deal...</h2>
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
              Please connect your wallet to submit evidence.
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
          
          <h1 className="text-3xl font-bold mb-2">Submit Evidence</h1>
          <p className="text-muted-foreground">
            Provide evidence for AI arbitration on deal {dealId?.slice(0, 8)}...
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
              <Badge variant={deal.status === 'DISPUTED' ? 'destructive' : 'default'}>
                {deal.status}
              </Badge>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                <strong>Deal ID:</strong> {deal.id}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Evidence submission failed: {submitError?.message || 'Unknown error'}
            </AlertDescription>
          </Alert>
        )}

        {/* AI Arbitration Info */}
        <Alert className="mb-6">
          <Brain className="h-4 w-4" />
          <AlertDescription>
            Our AI arbiter will analyze your evidence along with any counterparty submissions to make a fair resolution. 
            Be specific and provide clear documentation of your case.
          </AlertDescription>
        </Alert>

        {/* Evidence Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Evidence Type</CardTitle>
            <CardDescription>
              Choose what type of evidence you want to submit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setEvidenceType('text')}
                className={`p-4 border rounded-lg text-center transition-colors ${
                  evidenceType === 'text' ? 'border-primary bg-primary/10' : 'border-muted'
                }`}
              >
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-medium">Text Only</h4>
                <p className="text-xs text-muted-foreground">Written description</p>
              </button>
              
              <button
                onClick={() => setEvidenceType('file')}
                className={`p-4 border rounded-lg text-center transition-colors ${
                  evidenceType === 'file' ? 'border-primary bg-primary/10' : 'border-muted'
                }`}
              >
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-medium">Files Only</h4>
                <p className="text-xs text-muted-foreground">Documents, images</p>
              </button>
              
              <button
                onClick={() => setEvidenceType('both')}
                className={`p-4 border rounded-lg text-center transition-colors ${
                  evidenceType === 'both' ? 'border-primary bg-primary/10' : 'border-muted'
                }`}
              >
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-medium">Text + Files</h4>
                <p className="text-xs text-muted-foreground">Complete evidence</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Text Evidence */}
        {(evidenceType === 'text' || evidenceType === 'both') && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Description</CardTitle>
              <CardDescription>
                Explain your side of the dispute clearly and provide context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="evidence-description">Evidence Description *</Label>
                  <Textarea
                    id="evidence-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a detailed explanation of your case, what went wrong, timeline of events, attempts to resolve the issue, etc..."
                    rows={6}
                    className="mt-1"
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {description.length}/2000 characters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Evidence */}
        {(evidenceType === 'file' || evidenceType === 'both') && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>File Evidence</CardTitle>
              <CardDescription>
                Upload supporting documents, screenshots, or other evidence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported: PDF, DOC, TXT, JPG, PNG, GIF • Max 10MB each
                  </p>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Files:</h4>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFile(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Section */}
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
            <CardDescription>
              Once submitted, your evidence will be analyzed by our AI arbiter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-blue-600" />
                  <div className="text-sm">
                    <strong>Next Steps:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                      <li>Your evidence will be submitted to our AI arbitration system</li>
                      <li>The counterparty will be notified and can submit their evidence</li>
                      <li>AI arbiter will analyze all evidence and provide a resolution</li>
                      <li>You'll be notified when the decision is available</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/deal/${dealId}`)}
                  disabled={isUploading || isSubmitting}
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  disabled={
                    isUploading || 
                    isSubmitting || 
                    (!description.trim() && files.length === 0)
                  }
                  className="min-w-[120px]"
                >
                  {isUploading || isSubmitting ? (
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EvidencePage;