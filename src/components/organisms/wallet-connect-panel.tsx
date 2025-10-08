import React from "react";
import { WalletProviderCard } from "@/components/molecules/wallet-provider-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
type WalletProviderId = "phantom" | "solflare" | "backpack";
import { CheckCircle2, Info } from "lucide-react";

export interface WalletConnectPanelProps {
  onConnected?: (address: string, provider: WalletProviderId) => void;
}

export const WalletConnectPanel: React.FC<WalletConnectPanelProps> = ({ onConnected }) => {
  const [address, setAddress] = React.useState<string | undefined>(undefined);
  const [provider, setProvider] = React.useState<WalletProviderId | undefined>(undefined);

  const providers = React.useMemo(
    () => [
      { id: "phantom" as WalletProviderId, name: "Phantom", installed: true, installUrl: "https://phantom.app/" },
      { id: "solflare" as WalletProviderId, name: "Solflare", installed: true, installUrl: "https://solflare.com/" },
      { id: "backpack" as WalletProviderId, name: "Backpack", installed: false, installUrl: "https://www.backpack.app/" }
    ],
    []
  );

  const handleConnected = (addr: string, id: WalletProviderId) => {
    setAddress(addr);
    setProvider(id);
    onConnected?.(addr, id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {providers.map((p) => (
        <WalletProviderCard key={p.id} id={p.id} name={p.name} installed={p.installed} installUrl={p.installUrl} onConnected={handleConnected} />
      ))}

      <div className="md:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
            <CardDescription>
              {address
                ? `Wallet connected via ${provider}`
                : "No wallet connected yet"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {address ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="font-mono">{address}</span>
                </>
              ) : (
                <>
                  <Info className="w-4 h-4" />
                  <span>Select a provider above to connect.</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button disabled={!address} className="bg-gradient-primary">
                Continue
              </Button>
              <Button variant="outline" asChild>
                <a href="https://solana.com/ecosystem/wallets" target="_blank" rel="noreferrer">
                  Learn about wallets
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletConnectPanel;
