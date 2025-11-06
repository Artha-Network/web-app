const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;
const CLUSTERS = ["devnet", "testnet", "mainnet-beta", "localnet", "localhost"] as const;

export type SolanaCluster = (typeof CLUSTERS)[number];

const DEFAULT_CLUSTER: SolanaCluster = "localnet";

export function isValidSolanaAddress(addr: string): boolean {
  if (typeof addr !== "string") return false;
  if (addr.length < 32 || addr.length > 44) return false;
  return BASE58_REGEX.test(addr);
}

export function resolveCluster(input?: string | null): SolanaCluster {
  if (!input) return DEFAULT_CLUSTER;
  const normalized = input.toLowerCase();
  return (CLUSTERS as readonly string[]).includes(normalized) ? (normalized as SolanaCluster) : DEFAULT_CLUSTER;
}

export function getConfiguredCluster(): SolanaCluster {
  const env = (import.meta as any)?.env ?? {};
  const value = env.NEXT_PUBLIC_SOLANA_CLUSTER ?? env.VITE_SOLANA_CLUSTER;
  return resolveCluster(typeof value === "string" ? value : undefined);
}
