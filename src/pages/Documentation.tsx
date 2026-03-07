import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Zap,
  Brain,
  Wallet,
  DollarSign,
  Lock,
  HelpCircle,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Scale,
  FileText,
  Users,
  Globe,
  Info,
} from "lucide-react";

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

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Learn & Documentation
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about using Artha Network, crypto wallets, and secure escrow transactions.
            </p>
          </div>

          <Tabs defaultValue="getting-started" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
              <TabsTrigger value="how-it-works">How It Works</TabsTrigger>
              <TabsTrigger value="crypto-basics">Crypto Basics</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            {/* ==================== GETTING STARTED ==================== */}
            <TabsContent value="getting-started" className="space-y-8">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  New to crypto? Start with the <strong>Crypto Basics</strong> tab to learn about wallets, SOL, and USDC before creating your first deal.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome to Artha Network</CardTitle>
                  <CardDescription>
                    Artha is a decentralized escrow platform built on Solana. It lets two parties safely trade goods, services, or assets
                    without trusting each other — your funds are locked in a smart contract on the blockchain, not held by Artha.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-1">Non-Custodial</h3>
                      <p className="text-sm text-muted-foreground">
                        Artha never holds your money. Funds sit in an on-chain escrow vault that only the smart contract can release.
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
                        <Brain className="w-6 h-6 text-secondary" />
                      </div>
                      <h3 className="font-semibold mb-1">AI Arbitration</h3>
                      <p className="text-sm text-muted-foreground">
                        If there's a dispute, our AI reviews evidence from both sides and issues a binding verdict — no lawyers needed.
                      </p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                        <Zap className="w-6 h-6 text-accent" />
                      </div>
                      <h3 className="font-semibold mb-1">Fast & Cheap</h3>
                      <p className="text-sm text-muted-foreground">
                        Solana transactions confirm in under a second and cost less than $0.01. Platform fee is only 0.5%.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Start Guide</CardTitle>
                  <CardDescription>Get your first deal running in 5 minutes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[
                      {
                        step: 1,
                        title: "Install a Solana Wallet",
                        desc: "Download Phantom or Solflare browser extension. This is your crypto wallet — it stores your keys and signs transactions.",
                        icon: Wallet,
                      },
                      {
                        step: 2,
                        title: "Connect & Create Profile",
                        desc: "Click 'Connect Wallet' on Artha, approve the connection, then set up your display name and email in your Profile.",
                        icon: Users,
                      },
                      {
                        step: 3,
                        title: "Fund Your Wallet",
                        desc: "You need USDC (the deal currency) and a small amount of SOL (for transaction fees). On devnet, you can get free test tokens.",
                        icon: DollarSign,
                      },
                      {
                        step: 4,
                        title: "Create a Deal",
                        desc: "Go to 'New Deal', fill in the details (counterparty wallet, amount, description), and our AI generates a contract for both parties.",
                        icon: FileText,
                      },
                      {
                        step: 5,
                        title: "Complete the Transaction",
                        desc: "The buyer funds the escrow, the seller delivers, and the buyer releases payment. If there's a problem, open a dispute.",
                        icon: CheckCircle2,
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shrink-0">
                            {item.step}
                          </div>
                          {item.step < 5 && <div className="w-px flex-1 bg-border mt-2" />}
                        </div>
                        <div className="pb-6">
                          <h4 className="font-semibold flex items-center gap-2">
                            <item.icon className="w-4 h-4 text-muted-foreground" />
                            {item.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== HOW IT WORKS ==================== */}
            <TabsContent value="how-it-works" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">The Escrow Flow</CardTitle>
                  <CardDescription>
                    Understanding each stage of an Artha deal from start to finish
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {[
                    {
                      status: "INIT",
                      color: "bg-gray-500",
                      title: "Deal Created",
                      desc: "The seller creates a deal with terms (amount, deadline, description). An AI-generated contract is reviewed by both parties. The deal is registered on the Solana blockchain.",
                    },
                    {
                      status: "FUNDED",
                      color: "bg-blue-600",
                      title: "Escrow Funded",
                      desc: "The buyer reviews the contract and accepts by funding the escrow. USDC is transferred from the buyer's wallet to a secure on-chain vault. The seller can now begin delivery.",
                    },
                    {
                      status: "DELIVERED",
                      color: "bg-indigo-600",
                      title: "Goods/Services Delivered",
                      desc: "The seller completes their obligations (delivers the car, finishes the service, etc.). For vehicle deals, the government title transfer is tracked automatically.",
                    },
                    {
                      status: "RELEASED",
                      color: "bg-green-600",
                      title: "Payment Released",
                      desc: "Once satisfied, the buyer releases the escrowed funds to the seller. The transaction is final and recorded on-chain. Both parties receive a completion email.",
                    },
                  ].map((stage, i) => (
                    <div key={stage.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <Badge className={`${stage.color} text-white shrink-0`}>{stage.status}</Badge>
                        {i < 3 && <div className="w-px flex-1 bg-border mt-2 min-h-[20px]" />}
                      </div>
                      <div>
                        <h4 className="font-semibold">{stage.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{stage.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-purple-600" />
                    Dispute Resolution & AI Arbitration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    If something goes wrong, either party can open a dispute while the deal is in FUNDED status.
                    Here's what happens:
                  </p>
                  <div className="space-y-3">
                    {[
                      { step: "Open Dispute", desc: "Either buyer or seller opens an on-chain dispute. Funds remain frozen in escrow — nobody can withdraw." },
                      { step: "Submit Evidence", desc: "Both parties upload text descriptions, screenshots, documents, or other evidence supporting their case." },
                      { step: "AI Arbitration", desc: "Our AI arbiter (powered by Claude) analyzes all evidence and issues a verdict: RELEASE (pay seller) or REFUND (return to buyer)." },
                      { step: "Execute Verdict", desc: "The winning party can execute immediately. The losing party has 24 hours to accept or escalate to a human arbiter." },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300">{i + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{item.step}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      AI arbitration typically takes <strong>10-30 seconds</strong> once triggered. The AI reviews all evidence in one pass
                      and issues an immediate verdict with a confidence score. There is no waiting period — the decision is instant.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Security & Trust
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { title: "Artha Cannot Access Your Funds", desc: "Your USDC goes directly into a smart contract vault on Solana. Artha has no admin keys, no backdoors, and no ability to move your money." },
                      { title: "Your Wallet = Your Keys", desc: "You control your wallet and its private keys. Artha only asks you to sign transactions — we never see or store your private key." },
                      { title: "Everything Is On-Chain", desc: "Every deal, funding event, dispute, and resolution is recorded on the Solana blockchain as a permanent, tamper-proof record." },
                      { title: "AI Is Impartial", desc: "The AI arbiter has no stake in the outcome. It analyzes evidence objectively and cannot be bribed or influenced." },
                    ].map((item, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== CRYPTO BASICS ==================== */}
            <TabsContent value="crypto-basics" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <BookOpen className="w-6 h-6" />
                    Crypto 101 for Artha Users
                  </CardTitle>
                  <CardDescription>
                    You don't need to be a crypto expert to use Artha. Here's everything you need to know.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* What is a Wallet */}
                  <div className="border-l-4 border-primary pl-4 space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary" />
                      What Is a Crypto Wallet?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      A crypto wallet is like a digital bank account, but <strong>you</strong> control it — no bank involved.
                      It stores your cryptocurrencies and lets you send/receive money. Your wallet has:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                      <li><strong>Public Address</strong> — like your bank account number. Safe to share. Others use it to send you money.</li>
                      <li><strong>Private Key / Seed Phrase</strong> — like your ATM PIN. <strong>Never share this with anyone!</strong> If someone has it, they can take all your money.</li>
                    </ul>
                    <Alert className="mt-3">
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        We recommend <strong>Phantom</strong> or <strong>Solflare</strong> wallet extensions for your browser. They're free, secure, and easy to install.
                      </AlertDescription>
                    </Alert>
                  </div>

                  {/* SOL vs USDC */}
                  <div className="border-l-4 border-yellow-500 pl-4 space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                      SOL vs USDC — Two Tokens, Two Purposes
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 mt-2">
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">SOL (Solana)</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          SOL is the <strong>native token</strong> of the Solana blockchain. Think of it as "gas money" — you need a tiny bit of SOL to pay transaction fees.
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-yellow-700 border-yellow-300">Transaction fees</Badge>
                          <Badge variant="outline" className="text-yellow-700 border-yellow-300">~$0.001 per tx</Badge>
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-bold text-green-800 dark:text-green-200 mb-2">USDC (USD Coin)</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          USDC is a <strong>stablecoin</strong> pegged 1:1 to the US Dollar. 1 USDC = $1 USD, always. This is the currency used in Artha deals.
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-700 border-green-300">Deal currency</Badge>
                          <Badge variant="outline" className="text-green-700 border-green-300">1 USDC = $1</Badge>
                        </div>
                      </div>
                    </div>
                    <Alert variant="destructive" className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Common mistake:</strong> Having SOL but no USDC. SOL cannot be used to fund deals — you specifically need USDC tokens. Make sure you have both: SOL for fees + USDC for the deal amount.
                      </AlertDescription>
                    </Alert>
                  </div>

                  {/* What is Blockchain */}
                  <div className="border-l-4 border-blue-500 pl-4 space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      What Is a Blockchain?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      A blockchain is a public, permanent record of every transaction that has ever happened. Think of it as a giant spreadsheet that:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                      <li>Everyone can see (transparent)</li>
                      <li>Nobody can edit or delete (immutable)</li>
                      <li>No single company controls (decentralized)</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      Artha uses <strong>Solana</strong>, one of the fastest blockchains (transactions confirm in ~0.4 seconds).
                    </p>
                  </div>

                  {/* Smart Contracts */}
                  <div className="border-l-4 border-purple-500 pl-4 space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      What Are Smart Contracts?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      A smart contract is a program that runs on the blockchain. It automatically enforces the rules of a deal:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                      <li>Holds funds in escrow until conditions are met</li>
                      <li>Only releases money when the buyer confirms delivery</li>
                      <li>Cannot be tampered with — the code is public and immutable</li>
                      <li>Artha has no special access — the contract enforces the rules for everyone equally</li>
                    </ul>
                  </div>

                  {/* Devnet vs Mainnet */}
                  <div className="border-l-4 border-orange-500 pl-4 space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Devnet vs Mainnet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Artha is currently running on <strong>Solana Devnet</strong> (a test network). This means:
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                      <li>All tokens are <strong>fake/test tokens</strong> with no real-world value</li>
                      <li>You can get free SOL from a "faucet" for testing</li>
                      <li>Feel free to experiment — nothing is at risk</li>
                      <li>When we launch on Mainnet, you'll use real USDC (backed by real USD)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== FAQ ==================== */}
            <TabsContent value="faq" className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Frequently Asked Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    {
                      q: "Can Artha steal my money?",
                      a: "No. Artha is non-custodial. Your funds are locked in a Solana smart contract, not in Artha's bank account. We have no admin keys and cannot move, freeze, or access your escrowed funds. Only the smart contract logic (buyer releases, seller refunds, or AI verdict) can move funds.",
                    },
                    {
                      q: "What if I lose my wallet / seed phrase?",
                      a: "If you lose access to your wallet, you lose access to your funds — Artha cannot recover them for you. This is why it's critical to back up your seed phrase (the 12 or 24 words your wallet gave you when you set it up). Store it somewhere safe and offline.",
                    },
                    {
                      q: "Why do I need SOL if I'm paying in USDC?",
                      a: "SOL is used to pay Solana network transaction fees (like a small 'postage stamp' for each transaction). A typical Artha transaction costs less than $0.01 in SOL. You need a tiny amount of SOL in your wallet even if your deal is entirely in USDC.",
                    },
                    {
                      q: "How does AI arbitration work?",
                      a: "When a dispute is opened, both parties submit evidence (text, screenshots, documents). Our AI arbiter (powered by Claude) analyzes all evidence in about 10-30 seconds and issues a verdict: RELEASE (pay the seller) or REFUND (return funds to buyer), along with a confidence score and reasoning. The winning party can execute immediately, while the losing party has 24 hours to accept or escalate to a human arbiter.",
                    },
                    {
                      q: "How long does AI arbitration take?",
                      a: "The AI analysis itself takes 10-30 seconds once triggered. However, both parties should submit their evidence before requesting arbitration. There is no waiting period or queue — the verdict is instant after you click 'Request AI Verdict'.",
                    },
                    {
                      q: "Can I appeal an AI verdict?",
                      a: "Currently, AI verdicts are final. The system is designed to be fair by analyzing evidence from both sides equally. In the future, we may add a human arbitration option for high-value disputes.",
                    },
                    {
                      q: "What is the minimum deal amount?",
                      a: "The minimum deal amount is $10 USDC. There is no maximum — the smart contract supports any amount.",
                    },
                    {
                      q: "What are the fees?",
                      a: "Artha charges a flat 0.5% platform fee on each deal. Additionally, Solana network fees apply (typically less than $0.01 per transaction). There are no hidden fees, monthly subscriptions, or withdrawal charges.",
                    },
                    {
                      q: "What happens if the seller doesn't deliver?",
                      a: "If the delivery deadline passes without the buyer releasing funds, the buyer can either: (1) continue waiting, (2) open a dispute for AI arbitration, or (3) the deal terms may specify automatic refund conditions.",
                    },
                    {
                      q: "Is the AI contract legally binding?",
                      a: "The AI-generated contract serves as a clear record of terms agreed upon by both parties. While enforceability depends on your jurisdiction, the on-chain escrow ensures financial enforcement — the smart contract will not release funds unless conditions are met.",
                    },
                    {
                      q: "Can I use Artha on mobile?",
                      a: "Yes, if you use a mobile wallet app like Phantom or Solflare. Open the Artha website in your wallet's built-in browser to connect and transact.",
                    },
                    {
                      q: "What currencies are supported?",
                      a: "Currently, Artha supports USDC (USD Coin) on Solana. USDC is a stablecoin backed 1:1 by US dollars, so 1 USDC always equals $1. We plan to add support for other stablecoins in the future.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="border-b last:border-0 pb-4 last:pb-0">
                      <h3 className="font-semibold mb-2">{item.q}</h3>
                      <p className="text-sm text-muted-foreground">{item.a}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">Still have questions?</p>
                <Link to="/escrow/new">
                  <Button>
                    Create Your First Deal <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Documentation;
