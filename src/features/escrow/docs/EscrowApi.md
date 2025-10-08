# Escrow API (UI Client)

Exported function definitions used by UI components/pages. No backend logic; implementation lives in server-side services.

- Type: Feature API
- Location: `src/features/escrow/api.ts`

## Functions
- `createEscrow(input: EscrowInit): Promise<{ dealId: string }>` — create a new escrow draft via Actions Server (not implemented here)

## Usage
```ts
import { createEscrow } from "@/features/escrow/api";
```

## Interactions
- Calls: actions-server endpoint `POST /api/escrow/initiate`
  - Server file: `actions-server/src/routes/initiate/index.ts`
- Types: UI payload `EscrowInit` (web-app) maps to `InitiateEscrowInput` (actions-server)
  - Server types: `actions-server/src/types/escrow.ts`

### Updates
- v1.0.0 — Initial creation
