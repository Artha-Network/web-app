# Escrow Types

Shared UI-facing TypeScript types used by escrow pages/components.

- Type: Types
- Location: `src/types/escrow.ts`

## Exports
- `EscrowCurrency` — enum-like union (currently `"USDC"`)
- `EscrowInitFormValues` — form state shape (uses `Date | null`)
- `EscrowInit` — normalized payload for APIs (uses `dueDateUnix`)

## Usage
```ts
import type { EscrowInit } from "@/types/escrow";
```

### Updates
- v1.0.0 — Initial creation

