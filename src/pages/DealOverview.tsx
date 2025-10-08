import React from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DealOverview: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Deal Overview</h1>
        <p className="text-muted-foreground">Deal ID: {id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Transaction history, participants, and status go here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to={`/upload?deal=${id}`}>Upload Evidence</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={`/dispute/${id}`}>Open Dispute</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/profile">View Profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DealOverview;

