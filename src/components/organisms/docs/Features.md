# Features Organism

## Purpose
The Features component showcases the key features and benefits of the Artha Network platform in a visually appealing grid layout. It highlights blockchain security, AI arbitration, and micro-escrow capabilities.

## Component Type
**Organism** - Complex component composed of multiple feature cards

## Location
`src/components/organisms/Features.tsx`

## Props
This component accepts no props - it's a static presentation component.

## Composed Of
- **Atoms**:
  - Icons (Shield, Brain, DollarSign, Lock, Zap, Users from lucide-react)
  
- **Molecules**:
  - Feature Card (icon + title + description)

## Structure
```
Features
└── Section Container
    ├── Section Header
    │   ├── Heading (h2)
    │   └── Description
    └── Features Grid
        ├── Feature Card 1: Blockchain Security
        ├── Feature Card 2: AI-Powered Arbitration
        ├── Feature Card 3: Micro-Escrow Solutions
        ├── Feature Card 4: Smart Contract Protection
        ├── Feature Card 5: Instant Settlement
        └── Feature Card 6: Community Trust
```

## Usage

```tsx
import Features from '@/components/organisms/Features';

function LandingPage() {
  return (
    <div>
      <Features />
    </div>
  );
}
```

## Design Tokens Used

### Colors
- `bg-background` - Section background
- `text-foreground` - Main text
- `text-muted-foreground` - Description text
- `bg-primary/10` - Icon background
- `text-primary` - Icon color

### Spacing
- `py-20` - Vertical section padding
- `gap-12` - Spacing between header and grid
- `gap-8` - Grid gap between cards

### Typography
- `text-3xl md:text-4xl` - Section heading
- `text-xl` - Section description
- `text-xl font-semibold` - Feature titles
- `text-muted-foreground` - Feature descriptions

## Features Listed

1. **Blockchain Security** - Transactions secured on Solana blockchain
2. **AI-Powered Arbitration** - Fair dispute resolution with AI
3. **Micro-Escrow Solutions** - Support for transactions as low as $10
4. **Smart Contract Protection** - Automated escrow management
5. **Instant Settlement** - Quick fund release upon completion
6. **Community Trust** - Decentralized reputation system

## Responsive Behavior
- Mobile: Single column grid
- Tablet: 2-column grid
- Desktop: 3-column grid

## Accessibility
- ✅ Semantic HTML (section, h2, h3)
- ✅ Proper heading hierarchy
- ✅ Icon decorative elements
- ✅ High contrast text

---

**Last Updated**: 2025-01-26