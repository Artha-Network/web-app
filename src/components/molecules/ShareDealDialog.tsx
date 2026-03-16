import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Share2 } from "lucide-react";

interface ShareDealDialogProps {
  dealId: string;
  dealTitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareDealDialog: React.FC<ShareDealDialogProps> = ({
  dealId,
  dealTitle,
  open,
  onOpenChange,
}) => {
  const [copied, setCopied] = useState(false);
  const dealUrl = `${window.location.origin}/deal/${dealId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(dealUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = dealUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Deal
          </DialogTitle>
          <DialogDescription>
            {dealTitle
              ? `Share "${dealTitle}" with the other party.`
              : "Share this deal link with the other party."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* QR Code */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <QRCodeSVG
              value={dealUrl}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Scan this QR code to open the deal page
          </p>

          {/* Copy Link */}
          <div className="flex w-full items-center gap-2">
            <Input
              readOnly
              value={dealUrl}
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDealDialog;
