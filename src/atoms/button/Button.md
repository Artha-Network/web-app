# Button (Atom)

Thin proxy to the shared UI `Button` component. Placed under `atoms/` to align with atomic structure while reusing the centralized primitive.

- Type: Atom
- Location: `src/atoms/button/Button.tsx`

## Purpose
Expose a consistent import path for the Button atom within the atomic architecture.

## Usage
```tsx
import { Button } from "@/atoms/button";

<Button>Click me</Button>
```

### Updates
- v1.0.0 — Initial creation (re-export of `@/components/ui/button`)

