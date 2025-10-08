import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";

const EvidenceUpload: React.FC = () => {
  const [search] = useSearchParams();
  const dealId = search.get("deal");
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Evidence uploaded (stub)");
    if (dealId) navigate(`/deal/${dealId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Evidence Upload</h1>
        <p className="text-muted-foreground">Deal: {dealId ?? "(none)"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit Files</CardTitle>
          <CardDescription>Drag and drop coming soon — basic input for now.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <div className="flex gap-3">
              <Button type="submit" disabled={!file}>Upload</Button>
              {dealId && (
                <Button type="button" variant="outline" onClick={() => navigate(`/deal/${dealId}`)}>
                  Back to Deal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvidenceUpload;

