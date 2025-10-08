import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Shield, Wallet, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const GetStarted = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-primary">
              Artha Network
            </Link>
            <Link to="/">
              <Button variant="ghost">← Back to Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Get Started with Artha Network
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Begin your journey with decentralized AI-powered escrow services. Safe, secure, and intelligent.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary" />
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>1. Connect Wallet</CardTitle>
                <CardDescription>
                  Connect your Solana wallet to start using our decentralized escrow services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Connect Wallet</Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-secondary" />
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>2. Create Escrow</CardTitle>
                <CardDescription>
                  Set up your first escrow transaction with our AI-powered smart contracts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full">Create Escrow</Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-success" />
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>3. Trade Safely</CardTitle>
                <CardDescription>
                  Execute transactions with confidence knowing AI arbitration protects both parties.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">Start Trading</Button>
              </CardContent>
            </Card>
          </div>

          {/* Features Checklist */}
          <Card className="mb-16">
            <CardHeader>
              <CardTitle className="text-2xl">What You Get</CardTitle>
              <CardDescription>
                Comprehensive protection and features for all your transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>AI-powered dispute resolution</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>Solana blockchain security</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>Transactions from $10+</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>Less than 1% platform fee</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>24/7 automated arbitration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>Instant settlement</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300 group">
              Launch App
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;