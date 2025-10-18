<<<<<<< HEAD

# web-app

End-user UI; feature-first. Uses wallet adapter; calls actions-server for tx.

---

````md
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
=======
# Artha Network - Decentralized AI-Powered Escrow Platform

## Project Overview

Artha Network is a blockchain-based escrow platform with AI-powered dispute resolution. Built with React, TypeScript, and TailwindCSS following **Atomic Design principles** for maximum modularity.

## Architecture

This project follows **Atomic Design methodology**:

- **Atoms**: Basic UI elements (buttons, inputs, icons)
- **Molecules**: Simple combinations (cards, form fields)
- **Organisms**: Complex sections (Hero, Features, Footer)
- **Templates**: Page layouts
- **Pages**: Complete pages with content

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed structure.

## Documentation System

Every component has dual documentation:

1. **ComponentName.md** - Human-readable docs
2. **ComponentName.json** - Machine-readable specs

See [COMPONENT_DOCUMENTATION_GUIDE.md](./COMPONENT_DOCUMENTATION_GUIDE.md) for how to document components.

## Project Structure
```
````

src/components/
├── atoms/ui/ # Basic UI primitives (shadcn/ui)
├── molecules/ # Simple combinations
├── organisms/ # Complex sections
│ ├── Hero.tsx
│ ├── Features.tsx
│ └── docs/ # Component documentation
└── templates/ # Page layouts

```

## Technology Stack

- React 18.3.1 + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- shadcn/ui (component library)
- React Router DOM (routing)
>>>>>>> 7947178 (chore: initialize web-app UI project)
```
