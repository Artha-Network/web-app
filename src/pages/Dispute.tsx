import React from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dispute: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Dispute Resolution</h1>
        <p className="text-muted-foreground">Deal: {id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Arbitration</CardTitle>
          <CardDescription>Evidence review and verdict display will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild>
            <Link to={`/deal/${id}`}>Back to Deal</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/profile">View Profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dispute;

