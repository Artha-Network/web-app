# Architecture Documentation

## Atomic Design Implementation

This document provides a detailed overview of how Atomic Design principles are implemented in the Artha Network project.

## Folder Structure

```
src/components/
├── atoms/
│   ├── ui/                      # shadcn/ui primitive components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── ... (all UI primitives)
│   └── docs/                    # Atom documentation
│       ├── Button.md
│       ├── Button.json
│       └── ...
├── molecules/
│   ├── docs/                    # Molecule documentation
│   └── (future molecule components)
├── organisms/
│   ├── Hero.tsx                 # Hero section component
│   ├── Features.tsx             # Features showcase
│   ├── HowItWorks.tsx          # Process explanation
│   ├── Team.tsx                 # Team member grid
│   ├── Footer.tsx               # Site footer
│   └── docs/                    # Organism documentation
│       ├── Hero.md
│       ├── Hero.json
│       └── ...
└── templates/
    ├── docs/                    # Template documentation
    └── (future template components)
```

## Component Categories

### Atoms (Level 1)
**Definition**: The smallest, indivisible UI components that cannot be broken down further without losing functionality.

**Current Implementation**:
- All components in `src/components/atoms/ui/`
- Based on shadcn/ui library (Radix UI + Tailwind)
- Examples: Button, Input, Label, Badge, Avatar, Separator, etc.

**Characteristics**:
- No business logic
- Highly reusable
- Configurable via props
- Styled with Tailwind utilities
- Type-safe with TypeScript

**Example Atoms**:
```typescript
// Button atom
<Button variant="default" size="lg">Click Me</Button>

// Badge atom
<Badge variant="outline">New</Badge>

// Input atom
<Input type="email" placeholder="Enter email" />
```

### Molecules (Level 2)
**Definition**: Simple combinations of atoms that work together as a unit.

**Planned Implementation**:
- Card with content (Card + Text + Button)
- Form fields (Label + Input + Error message)
- Navigation items (Link + Icon + Badge)
- Search bar (Input + Button + Icon)

**Characteristics**:
- Composed of 2-3 atoms
- Single responsibility
- Reusable across organisms
- May contain minimal logic

**Example Molecules**:
```typescript
// Form Field molecule (to be created)
<FormField 
  label="Email"
  type="email"
  error="Invalid email"
/>

// Card Item molecule (to be created)
<CardItem 
  title="Feature Name"
  description="Description text"
  icon={<Icon />}
/>
```

### Organisms (Level 3)
**Definition**: Complex UI components composed of molecules and/or atoms that form distinct sections of an interface.

**Current Implementation**:
- `Hero.tsx` - Landing page hero section
- `Features.tsx` - Feature grid with cards
- `HowItWorks.tsx` - Process steps explanation
- `Team.tsx` - Team member showcase
- `Footer.tsx` - Site footer with links

**Characteristics**:
- Self-contained sections
- May include business logic
- Composed of multiple molecules/atoms
- Represent meaningful interface regions

**Example Organisms**:
```typescript
// Hero organism
<Hero />  // Contains heading, description, CTA buttons, background

// Features organism
<Features />  // Contains grid of feature cards with icons and descriptions
```

### Templates (Level 4)
**Definition**: Page-level layouts that define structure but don't contain specific content.

**Planned Implementation**:
- MainLayout (Header + Content + Footer)
- DashboardLayout (Sidebar + Main content area)
- FormLayout (Centered form container)
- DocsLayout (Sidebar navigation + Content)

**Characteristics**:
- Define page structure
- Provide slots for content
- Handle responsive layouts
- May include navigation

**Example Templates**:
```typescript
// MainLayout template (to be created)
<MainLayout>
  <Outlet />  // Content goes here
</MainLayout>
```

### Pages (Level 5)
**Definition**: Specific instances of templates with real content and data.

**Current Implementation**:
- `Index.tsx` - Landing page (Home)
- `GetStarted.tsx` - Onboarding page
- `Documentation.tsx` - Technical documentation
- `NotFound.tsx` - 404 error page

**Characteristics**:
- Combine templates with real content
- Handle data fetching
- Manage page-specific state
- Define routes

## Documentation System

### Component Documentation Files

Every component requires two documentation files:

#### 1. Markdown Documentation (.md)
**Location**: `src/components/{level}/docs/{ComponentName}.md`

**Structure**:
```markdown
# Component Name

## Purpose
Brief description of what the component does.

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | string | "default" | Visual style variant |

## Usage
```tsx
import { Component } from '@/components/...'

<Component prop="value" />
```

## Examples
Visual examples and use cases.

## Accessibility
ARIA labels, keyboard navigation notes.
```

#### 2. JSON Specification (.json)
**Location**: `src/components/{level}/docs/{ComponentName}.json`

**Structure**:
```json
{
  "name": "ComponentName",
  "type": "atom|molecule|organism|template",
  "description": "Brief description",
  "props": [
    {
      "name": "variant",
      "type": "string",
      "required": false,
      "default": "default",
      "description": "Visual style variant"
    }
  ],
  "dependencies": ["Button", "Card"],
  "examples": [
    {
      "title": "Basic usage",
      "code": "<Component />"
    }
  ]
}
```

## Design System Integration

### Color System
All components use semantic color tokens from `src/index.css`:

```css
/* Semantic tokens */
--primary: [hsl value]
--secondary: [hsl value]
--accent: [hsl value]
--background: [hsl value]
--foreground: [hsl value]
```

Usage in components:
```tsx
// ✅ CORRECT - Use semantic tokens
<div className="bg-primary text-primary-foreground">

// ❌ WRONG - Don't use direct colors
<div className="bg-blue-500 text-white">
```

### Responsive Design
Mobile-first approach using Tailwind breakpoints:

```tsx
<div className="
  flex flex-col          // Mobile: stack vertically
  md:flex-row           // Tablet: horizontal layout
  lg:gap-8              // Desktop: larger gaps
  xl:max-w-7xl          // Large screens: constrain width
">
```

### Component Composition

Preferred pattern - compose from smaller pieces:

```tsx
// ✅ GOOD - Composable
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>

// ❌ BAD - Monolithic
<Card 
  title="Title"
  content="Content here"
/>
```

## Best Practices

### Component Creation

1. **Start Small**: Create atoms first, then build up
2. **Single Responsibility**: Each component does one thing well
3. **Prop Drilling**: Avoid passing props through many layers
4. **Composition**: Prefer composition over configuration
5. **Type Safety**: Always use TypeScript interfaces

### File Organization

1. **Colocation**: Keep related files together
2. **Index Files**: Use for cleaner imports
3. **Documentation**: Create docs before implementation
4. **Tests**: Place tests next to components (future)

### Code Quality

1. **Naming**: Clear, descriptive component names
2. **Comments**: Explain why, not what
3. **Formatting**: Use Prettier (auto-formatted)
4. **Linting**: Follow ESLint rules
5. **Accessibility**: Always consider a11y

## Migration Guide

When restructuring existing components:

1. **Identify Level**: Determine if atom, molecule, organism, or template
2. **Move File**: Place in appropriate folder
3. **Update Imports**: Fix all import statements
4. **Create Docs**: Write .md and .json files
5. **Test**: Verify functionality unchanged
6. **Refactor**: Improve if needed (optional)

## Future Enhancements

### Planned Components

**Molecules**:
- FormField (Label + Input + Error)
- SearchBar (Input + Icon + Button)
- CardItem (Card + Icon + Title + Description)
- NavItem (Link + Icon + Badge)

**Templates**:
- MainLayout (Header + Content + Footer)
- DashboardLayout (Sidebar + Content)
- AuthLayout (Centered form container)

**Pages**:
- Dashboard
- Profile
- Settings
- Transaction History

## Resources

- [Atomic Design by Brad Frost](https://atomicdesign.bradfrost.com/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Best Practices](https://react.dev/learn)

---

Last Updated: 2025-01-26