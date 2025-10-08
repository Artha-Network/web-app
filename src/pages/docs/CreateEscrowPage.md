# CreateEscrowPage

Page for initiating a new escrow draft using the `CreateEscrowForm` organism.

- Type: Page
- Location: `src/pages/CreateEscrow.tsx`
- Route: `/create-escrow`

## Usage
Add route in `src/App.tsx`:

```tsx
import CreateEscrowPage from "@/pages/CreateEscrow";
<Route path="/create-escrow" element={<CreateEscrowPage />} />
```

## Composition
- `CreateEscrowForm` (organism)
- `toast` from `@/components/ui/sonner` for UX feedback

### Updates
- v1.0.0 — Initial creation
