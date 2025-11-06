# Web App

React + Vite frontend that drives the seller/buyer experience. It connects to Phantom/Solflare via `@solana/wallet-adapter`, calls the Actions Server for unsigned transactions, signs in the browser, then confirms state in Supabase.

## Environment

Create a `.env` from `.env.example` and populate:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SOLANA_CLUSTER` | `devnet` or `testnet` (mirrors Actions Server config) |
| `NEXT_PUBLIC_PROGRAM_ID` | Escrow program id (matches Actions Server) |
| `NEXT_PUBLIC_USDC_MINT` | Cluster-specific USDC mint |
| `SUPABASE_URL` | Supabase REST URL |
| `SUPABASE_ANON_KEY` | Supabase anon key (never the service role) |
| `VITE_SOLANA_RPC` | Optional override RPC endpoint |

The wallet flow persists the Supabase anon session only; all privileged writes happen server-side.

## Scripts

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm preview
pnpm lint
```

## Working With Actions

Hooks wrap the full “build → sign → confirm → refresh” lifecycle:

```ts
const initiate = useAction("initiate");
await initiate.mutateAsync({
  counterparty: buyerWallet,
  amount: 125,
  description: "Demo escrow",
  deliverBy: Math.floor(Date.now() / 1000) + 86400,
});
```

- `services/actions.ts` calls the new `/actions/*` endpoints.
- `useWalletTransactions()` deserialises base64 transactions and forwards them to the connected wallet.
- `useMyDeals()` and `useDeal()` read Supabase tables directly (RLS scoped to the connected wallet).

## Manual Test Flow

1. **Seller** connects Phantom and completes `Escrow Step 1 → Step 3`. This calls `/actions/initiate`, signs the transaction, confirms it, and redirects back to the dashboard.
2. **Buyer** (different wallet) opens the deal in **Deal Overview** and presses **Fund Escrow**. After the wallet signature, `/actions/confirm` transitions the deal to `FUNDED`.
3. **Buyer** presses **Release Funds** which moves the row to `RELEASED` and creates an `onchain_events` record.

Every step is visible on the dashboard (`useMyDeals`) and in the per-deal timeline.

## Notes

- The Supabase anon key is safe for client usage; the service role key never leaves the server.
- Feature flags such as `FEATURE_SPONSORED_FEES` are read from the Vite env (`import.meta.env`).
- Components follow the project’s Atomic Design conventions—wiring only, no redesigns.
