# ConnectWalletPage

The first onboarding step that lets users connect a Solana wallet (Phantom, Solflare, Backpack) and shows real-time connection status.

- Type: Page
- Location: `src/pages/connect-wallet.tsx`
- Composition: `WalletConnectPanel` (organism) + simple header and back link.

## Usage
Route this page to `/connect-wallet` in `src/App.tsx`:

```tsx
import ConnectWalletPage from "@/pages/connect-wallet";
<Route path="/connect-wallet" element={<ConnectWalletPage />} />
```

### Related
- `WalletConnectPanel` (organism)
- `WalletProviderCard` (molecule)

### Updates
- v1.0.0 – Initial creation
