import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEvent } from "@/hooks/useEvent";
import { getConfiguredCluster } from '@/utils/solana';
import { 
  Wallet, 
  Globe, 
  DollarSign, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';

// USDC mint address for devnet (we'll use this when SPL Token is available)
const USDC_MINT_ADDRESS = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

/**
 * Dashboard - Post-wallet-connection landing page
 * 
 * This page shows after successful wallet connection via the modal popup.
 * Displays wallet info, balances, USDC account status, and quick actions.
 * 
 * Route: /wallet-connect (redirected from modal after connection)
 * Events: connect_wallet_click, wallet_connected, network_switch
 * Storage: user_wallets table (pubkey, cluster), user_settings.default_wallet
 * Solana (read): wallet balance, USDC ATA presence
 */
const Dashboard = () => {
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { connection } = useConnection();
  const { trackEvent } = useEvent();
  
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cluster] = useState(getConfiguredCluster());

  // Track wallet connection events
  useEffect(() => {
    if (connected && publicKey) {
      trackEvent('wallet_connected', {
        wallet_type: wallet?.adapter?.name,
        network: cluster,
        wallet_address: publicKey.toString()
      });
    }
  }, [connected, publicKey, wallet, cluster, trackEvent]);

  // Fetch wallet balances
  const fetchWalletData = async () => {
    if (!publicKey || !connected) return;
    
    setIsLoading(true);
    try {
      // Fetch SOL balance
      const solBalance = await connection.getBalance(publicKey);
      setSolBalance(solBalance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [publicKey, connected, connection]);

  const handleNetworkSwitch = () => {
    trackEvent('network_switch', {
      from_network: cluster,
      to_network: cluster === 'devnet' ? 'testnet' : 'devnet'
    });
    // Network switching would be handled at the provider level
    // For now, just track the intent
  };

  const handleRefresh = () => {
    trackEvent('wallet_refresh', { wallet_address: publicKey?.toString() });
    fetchWalletData();
  };

  const handleDisconnect = () => {
    trackEvent('wallet_disconnected', { wallet_address: publicKey?.toString() });
    disconnect();
  };

  // If wallet not connected, user shouldn't be here (protected route handles this)
  // But show a fallback just in case
  if (!connected || !publicKey) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="pt-6">
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Wallet Not Connected</h2>
              <p className="text-muted-foreground mb-4">
                Please connect your wallet to access the dashboard.
              </p>
              <Link to="/">
                <Button>Return Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome Back!</h1>
            <p className="text-muted-foreground">
              Your wallet is connected and ready for secure escrow transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </div>

        {/* Wallet Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Connected Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Wallet</label>
                <p className="font-semibold">{wallet?.adapter?.name || 'Unknown'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Network</label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    <Globe className="w-3 h-3 mr-1" />
                    {cluster.charAt(0).toUpperCase() + cluster.slice(1)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNetworkSwitch}
                    className="text-xs"
                  >
                    Switch
                  </Button>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Address</label>
              <p className="font-mono text-sm break-all bg-muted p-3 rounded-lg">
                {publicKey.toString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SOL Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                SOL Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {isLoading ? (
                  <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                ) : (
                  `${solBalance?.toFixed(4) || '0.0000'} SOL`
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Available for transaction fees
              </p>
              {solBalance !== null && solBalance < 0.01 && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                  ⚠️ Low balance - you may need SOL for transactions
                </p>
              )}
            </CardContent>
          </Card>

          {/* USDC Preparation Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                USDC Ready
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                Coming Soon
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Setup Required
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                USDC integration will be available soon
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  USDC Integration Coming Soon
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Full USDC token account detection and balance display will be available soon. 
                  For now, you can create deals and the system will handle USDC accounts automatically.
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Expected USDC Mint: {USDC_MINT_ADDRESS}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ready to Get Started?</CardTitle>
            <CardDescription>
              Your wallet is connected! Choose what you'd like to do next.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link to="/deals">
                <Button variant="outline" className="w-full justify-between h-auto p-4 hover:bg-primary/5">
                  <div className="text-left">
                    <div className="font-semibold">Browse Deals</div>
                    <div className="text-sm text-muted-foreground">View active escrows</div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/escrow/new">
                <Button className="w-full justify-between h-auto p-4">
                  <div className="text-left">
                    <div className="font-semibold text-primary-foreground">Create New Deal</div>
                    <div className="text-sm text-primary-foreground/80">Start an escrow</div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              
              <Link to="/profile">
                <Button variant="outline" className="w-full justify-between h-auto p-4 hover:bg-primary/5">
                  <div className="text-left">
                    <div className="font-semibold">Profile & Settings</div>
                    <div className="text-sm text-muted-foreground">Manage account</div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
