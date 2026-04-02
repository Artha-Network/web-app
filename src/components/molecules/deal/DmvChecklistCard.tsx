import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle2 } from "lucide-react";

const CHECKLIST_ITEMS = [
  "Both parties sign the vehicle title (back of the certificate).",
  "Seller provides a signed Bill of Sale with VIN, sale price, date, and both parties' names.",
  "Buyer takes the signed title and Bill of Sale to their local DMV within 30 days.",
  "Buyer pays DMV title transfer fee and any applicable sales tax.",
  "Buyer receives a new title in their name (processing time varies by state).",
  "Seller submits a Release of Liability / Notice of Sale to their state DMV (protects seller from future liability).",
];

const DmvChecklistCard: React.FC = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-4 h-4" />
          Next Steps: Title Transfer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          The escrow is complete. Follow these steps to transfer the vehicle title at your local DMV.
        </p>
        <ol className="space-y-2">
          {CHECKLIST_ITEMS.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground mt-4">
          Requirements vary by state. Check your state DMV website for specific forms and fees.
        </p>
      </CardContent>
    </Card>
  );
};

export default DmvChecklistCard;
