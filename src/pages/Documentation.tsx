import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { ArrowLeft, Code, Shield, Zap, Brain, Users, Wallet } from "lucide-react";

const Documentation = () => {
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
              <Button variant="ghost">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Complete guide to using Artha Network's decentralized AI-powered escrow services
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="api">API Reference</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <Shield className="w-8 h-8 text-primary mb-4" />
                    <CardTitle>Security First</CardTitle>
                    <CardDescription>
                      Built on Solana blockchain with military-grade encryption and smart contract audits.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">Blockchain Secured</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Brain className="w-8 h-8 text-secondary mb-4" />
                    <CardTitle>AI Arbitration</CardTitle>
                    <CardDescription>
                      Advanced machine learning algorithms provide fair and instant dispute resolution.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">AI-Powered</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <Zap className="w-8 h-8 text-accent mb-4" />
                    <CardTitle>Instant Settlement</CardTitle>
                    <CardDescription>
                      Automated escrow release based on predefined conditions and AI verification.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">Automated</Badge>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">How It Works</CardTitle>
                  <CardDescription>
                    Understanding the Artha Network escrow process
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">1. Agreement</h3>
                      <p className="text-sm text-muted-foreground">
                        Buyer and seller agree on terms and create escrow smart contract
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-6 h-6 text-secondary" />
                      </div>
                      <h3 className="font-semibold mb-2">2. Deposit</h3>
                      <p className="text-sm text-muted-foreground">
                        Funds are securely held in blockchain escrow until conditions are met
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                        <Brain className="w-6 h-6 text-accent" />
                      </div>
                      <h3 className="font-semibold mb-2">3. Resolution</h3>
                      <p className="text-sm text-muted-foreground">
                        AI arbitration ensures fair resolution and automatic fund release
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="space-y-8">
              <Card>
                <CardHeader>
                  <Code className="w-8 h-8 text-primary mb-4" />
                  <CardTitle>API Endpoints</CardTitle>
                  <CardDescription>
                    RESTful API for integrating Artha Network escrow services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-success">POST</Badge>
                      <code className="text-sm">/api/escrow/create</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Create a new escrow transaction</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">GET</Badge>
                      <code className="text-sm">/api/escrow/&#123;id&#125;</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Get escrow transaction details</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-accent">PUT</Badge>
                      <code className="text-sm">/api/escrow/&#123;id&#125;/dispute</code>
                    </div>
                    <p className="text-sm text-muted-foreground">Initiate AI arbitration for disputes</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="examples" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Example Use Cases</CardTitle>
                  <CardDescription>
                    Real-world applications of Artha Network escrow
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">E-commerce Transactions</h3>
                    <p className="text-sm text-muted-foreground">
                      Secure online purchases with automatic release upon delivery confirmation.
                    </p>
                  </div>
                  <div className="border-l-4 border-secondary pl-4">
                    <h3 className="font-semibold mb-2">Freelance Services</h3>
                    <p className="text-sm text-muted-foreground">
                      Milestone-based payments for digital services and consulting work.
                    </p>
                  </div>
                  <div className="border-l-4 border-accent pl-4">
                    <h3 className="font-semibold mb-2">Digital Asset Trading</h3>
                    <p className="text-sm text-muted-foreground">
                      Safe exchange of NFTs, domain names, and other digital assets.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faq" className="space-y-8">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">What is the minimum transaction amount?</h3>
                      <p className="text-sm text-muted-foreground">
                        Artha Network supports escrow transactions starting from just $10, making it accessible for small and large transactions alike.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">How does AI arbitration work?</h3>
                      <p className="text-sm text-muted-foreground">
                        Our AI system analyzes transaction evidence, communication logs, and predefined conditions to make fair dispute resolutions automatically.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">What are the platform fees?</h3>
                      <p className="text-sm text-muted-foreground">
                        We charge less than 1% of the transaction value, one of the lowest rates in the industry.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Is my money safe?</h3>
                      <p className="text-sm text-muted-foreground">
                        Yes. All funds are secured by Solana blockchain smart contracts and protected by military-grade encryption.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Documentation;