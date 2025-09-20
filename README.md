# web-app
End-user UI; feature-first. Uses wallet adapter; calls actions-server for tx.

---

```md
# Web App (Next.js)

End-user UI for creating, funding, disputing, and resolving escrows. Uses wallet-adapter and calls the **Actions Server** to build transactions.

## Key Features
- Feature-first routing (`/features/escrow`, `/features/disputes`, etc.)
- Wallet adapters (Phantom/Solflare/Backpack)
- Evidence upload (Arweave/IPFS)
- Deal receipts + rationale link (from Arbiter)

## Scripts
```bash
pnpm i
pnpm dev       # localhost:3000
pnpm build && pnpm start

Environment
| Var                           | Description             |
| ----------------------------- | ----------------------- |
| `NEXT_PUBLIC_ACTIONS_BASEURL` | Actions server base URL |
| `NEXT_PUBLIC_RPC_URL`         | Solana RPC (read-only)  |

Structure
src/
  app/           # Next routes (app router)
  features/
    escrow/      # api.ts, hooks.ts, ui/
    disputes/
    evidence/
    reputation/
  shared/
    solana/      # wallet adapter init
    ui/          # design system
E2E Testing
pnpm cypress:open
# includes flows: initiate → fund → release (devnet stub)
Accessibility & UX

Keyboard navigable modals/menus

Error states (no wallet, insufficient USDC, simulation fail)

Mobile-first layout

License

MIT
