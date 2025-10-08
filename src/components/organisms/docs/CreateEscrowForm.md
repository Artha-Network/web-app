# CreateEscrowForm

UI organism for creating an escrow draft. Emits typed values to a parent component via `onSubmit`. No backend logic is included.

- Type: Organism
- Location: `web-app/src/components/organisms/create-escrow-form.tsx`
- Composition: Form atoms (Input, Textarea, Button) + Card + RHF helpers

## Props
- `defaultValues?: Partial<EscrowInitFormValues>` — optional defaults to prefill the form
- `onSubmit?: (values: EscrowInit) => void | Promise<void>` — handler that receives typed payload

## Usage
```tsx
import { CreateEscrowForm } from "@/components/organisms/create-escrow-form";
import type { EscrowInit } from "@/types/escrow";

const onSubmit = (v: EscrowInit) => console.log(v);

<CreateEscrowForm onSubmit={onSubmit} />
```

## Related
- `EscrowInit`, `EscrowInitFormValues` (types)
- `features/escrow/api.ts` (exported client stubs)

### Updates
- v1.0.0 — Initial creation

