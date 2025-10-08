import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const mockDeals = [
  { id: "DEAL-001", title: "Laptop Purchase", status: "FUNDED" },
  { id: "DEAL-002", title: "Freelance Design", status: "INITIATED" },
];

const Deals: React.FC = () => (
  <div className="container mx-auto px-4 py-8 space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
      <Button asChild>
        <Link to="/create-escrow">Create Escrow</Link>
      </Button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {mockDeals.map((d) => (
        <Card key={d.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{d.title}</span>
              <span className="text-sm text-muted-foreground">{d.status}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button asChild>
              <Link to={`/deal/${d.id}`}>View</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Deals;

