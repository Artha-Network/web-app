export type DealStatus = "INIT" | "FUNDED" | "DISPUTED" | "RESOLVED";

export interface UserRecord {
  wallet_address: string;
  created_at: string;
}

export interface DealRecord {
  id: string;
  status: DealStatus;
  title: string;
  counterparty: string;
  amountUsd: number;
  deadline: string;
}

const USERS_KEY = "artha:users";
const DEALS_KEY = "artha:deals";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export async function ensureUserRecord(wallet: string): Promise<UserRecord> {
  const users = readJson<Record<string, UserRecord>>(USERS_KEY, {});
  const existing = users[wallet];
  if (existing) return existing;
  const created: UserRecord = { wallet_address: wallet, created_at: new Date().toISOString() };
  users[wallet] = created;
  writeJson(USERS_KEY, users);
  return created;
}

export async function fetchDeals(_wallet?: string): Promise<DealRecord[]> {
  const seeded = readJson<DealRecord[] | undefined>(DEALS_KEY, undefined);
  if (seeded && Array.isArray(seeded)) return seeded;
  // Seed with mock data
  const mock: DealRecord[] = [
    { id: "1", status: "INIT", title: "Marketplace Car purchase with Alex", counterparty: "Sarah Johnson", amountUsd: 500, deadline: "2024-08-15" },
    { id: "2", status: "FUNDED", title: "Shipment from China", counterparty: "David Lee", amountUsd: 1200, deadline: "2024-08-20" },
    { id: "3", status: "DISPUTED", title: "NFT purchase", counterparty: "Emily Chen", amountUsd: 800, deadline: "2024-08-10" },
    { id: "4", status: "RESOLVED", title: "Lease Agreement for Retail Space", counterparty: "Michael Brown", amountUsd: 1500, deadline: "2024-08-05" },
  ];
  writeJson(DEALS_KEY, mock);
  return mock;
}

export async function createDeal(_input: Partial<DealRecord>): Promise<DealRecord> {
  const list = readJson<DealRecord[]>(DEALS_KEY, []);
  const rec: DealRecord = {
    id: String(list.length + 1),
    status: _input.status ?? "INIT",
    title: _input.title ?? "New Escrow",
    counterparty: _input.counterparty ?? "Unknown",
    amountUsd: _input.amountUsd ?? 0,
    deadline: _input.deadline ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  };
  list.unshift(rec);
  writeJson(DEALS_KEY, list);
  return rec;
}

