# WalletConnectPanel

Organism that orchestrates wallet connection across supported providers (Phantom, Solflare, Backpack) and exposes an overall connection status and CTA.

- Type: Organism
- Location: `src/components/organisms/wallet-connect-panel.tsx`
- Composition: Renders three `WalletProviderCard` instances and a status card.

## Props
- `onConnected?(address, provider)` — emitted when the first successful connection occurs.

## Behavior
- Lists providers with hardcoded installation status (dummy data).
- Enables a "Continue" CTA when a wallet is connected.

## Usage
```tsx
import WalletConnectPanel from "@/components/organisms/wallet-connect-panel";

<WalletConnectPanel onConnected={(addr, p) => console.log(addr, p)} />
```

### Updates
- v1.0.0 – Initial creation (multi-provider connect + status)
