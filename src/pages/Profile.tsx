import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Profile: React.FC = () => (
  <div className="container mx-auto px-4 py-8 space-y-6">
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">Profile & Reputation</h1>
      <p className="text-muted-foreground">User trust score, badges, and history.</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Account Overview</CardTitle>
        <CardDescription>Reputation score and recent deals.</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-3">
        <Button asChild>
          <Link to="/notifications">Notifications</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/deals">Your Deals</Link>
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default Profile;

