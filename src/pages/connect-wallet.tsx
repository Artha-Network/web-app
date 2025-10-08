import React from "react";
import { Link } from "react-router-dom";
import WalletConnectPanel from "@/components/organisms/wallet-connect-panel";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ConnectWalletPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Connect Your Wallet
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Choose your preferred Solana wallet to securely connect to Artha Network.
            We currently support Phantom, Solflare, and Backpack.
          </p>
        </div>

        <WalletConnectPanel onConnected={() => { /* hook for future navigation */ }} />

        <div className="mt-12 text-center">
          <Button variant="link" asChild>
            <a href="https://solana.com/ecosystem/wallets" target="_blank" rel="noreferrer">
              Don’t have a wallet? Explore options →
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletPage;

