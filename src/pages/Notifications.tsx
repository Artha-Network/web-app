import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  { id: 1, text: "Deal DEAL-001 funded", href: "/deal/DEAL-001" },
  { id: 2, text: "New dispute opened", href: "/dispute/DEAL-002" },
];

const Notifications: React.FC = () => (
  <div className="container mx-auto px-4 py-8 space-y-6">
    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
    <div className="space-y-3">
      {items.map((n) => (
        <Card key={n.id}>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              <Link className="hover:underline" to={n.href}>{n.text}</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Just now</CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default Notifications;

