import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet2, PlugZap, ExternalLink } from "lucide-react";

type WalletProviderId = "phantom" | "solflare" | "backpack";

const truncateAddress = (addr?: string, size: number = 4) => {
  if (!addr) return "";
  return addr.length <= size * 2 + 1 ? addr : `${addr.slice(0, size + 1)}…${addr.slice(-size)}`;
};

export interface WalletProviderCardProps {
  id: WalletProviderId;
  name: string;
  installed: boolean;
  installUrl: string;
  onConnected?: (address: string, id: WalletProviderId) => void;
}

export const WalletProviderCard: React.FC<WalletProviderCardProps> = ({ id, name, installed, installUrl, onConnected }) => {
  const [loading, setLoading] = React.useState(false);
  const [address, setAddress] = React.useState<string | undefined>(undefined);

  const handleConnect = async () => {
    setLoading(true);
    // Simulate async connect with dummy address
    await new Promise((r) => setTimeout(r, 600));
    const addr = `Artha_${id}_1111111111111111111111111111111`;
    setAddress(addr);
    setLoading(false);
    onConnected?.(addr, id);
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-accent" />
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{name}</CardTitle>
            <CardDescription>
              {installed ? "Detected in your browser" : "Not installed"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {address ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {truncateAddress(address)}
              </Badge>
              <span className="text-sm text-muted-foreground">Connected</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(address!)}>
              Copy
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Connect to continue</div>
            {installed ? (
              <Button size="sm" onClick={handleConnect} disabled={loading}>
                <PlugZap className="w-4 h-4 mr-2" />
                {loading ? "Connecting…" : "Connect"}
              </Button>
            ) : (
              <a
                className="inline-flex items-center text-sm text-primary hover:underline"
                href={installUrl}
                target="_blank"
                rel="noreferrer"
              >
                Install {name}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletProviderCard;
