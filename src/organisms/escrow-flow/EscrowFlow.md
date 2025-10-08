# EscrowFlow (Organism)

High-level UI wrapper for creating a new escrow. Composes `CreateEscrowForm` and emits the normalized payload.

- Type: Organism
- Location: `src/organisms/escrow-flow/EscrowFlow.tsx`

## Props
- `onCreate?: (payload: EscrowInit) => void | Promise<void>`

## Usage
```tsx
import { EscrowFlow } from "@/organisms/escrow-flow";

<EscrowFlow onCreate={(p) => console.log(p)} />
```

### Updates
- v1.0.0 — Initial creation

