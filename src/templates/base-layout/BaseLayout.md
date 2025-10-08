# BaseLayout (Template)

Simple page layout with optional header and footer slots.

- Type: Template
- Location: `src/templates/base-layout/BaseLayout.tsx`

## Props
- `header?: ReactNode`
- `footer?: ReactNode`
- `children: ReactNode`

## Usage
```tsx
import { BaseLayout } from "@/templates/base-layout/BaseLayout";

<BaseLayout header={<Header />} footer={<Footer />}>
  <Content />
</BaseLayout>
```

### Updates
- v1.0.0 — Initial creation

