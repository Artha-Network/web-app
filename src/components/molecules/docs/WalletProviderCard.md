# WalletProviderCard

A molecule that presents a single wallet provider (Phantom, Solflare, Backpack) with installation status, connect action, and connected address preview.

- Type: Molecule
- Location: `src/components/molecules/wallet-provider-card.tsx`
- Uses: `Card`, `Button`, `Badge` (local UI atoms). No external utils.

## Props
- `id` ("phantom" | "solflare" | "backpack") — target provider identifier.
- `onConnected?(address, id)` — callback fired after a successful connection.

## Behavior
- Receives installation status as props (no detection logic here).
- Renders a "Connect" button (installed) or install link (not installed).
- On connect, simulates a connection and shows a dummy address with copy.

## Usage
```tsx
import { WalletProviderCard } from "@/components/molecules/wallet-provider-card";

<WalletProviderCard id="phantom" onConnected={(addr, id) => console.log(addr, id)} />
```

### Relationships
- Composed by `WalletConnectPanel` (organism).
- Relies on `utils/wallet` for detection and connect logic.

### Updates
- v1.0.0 – Initial creation (connect flow + install status)
