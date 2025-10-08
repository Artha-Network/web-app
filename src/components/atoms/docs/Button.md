# Button Atom

## Purpose
The Button component is a fundamental UI element that triggers actions when clicked. It's built on top of Radix UI's Slot component and styled with Tailwind CSS, offering multiple variants and sizes for different use cases.

## Component Type
**Atom** - Basic, indivisible UI element

## Location
`src/components/ui/button.tsx` (currently in ui folder, should be in atoms/ui)

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| variant | "default" \| "destructive" \| "outline" \| "secondary" \| "ghost" \| "link" | "default" | No | Visual style variant |
| size | "default" \| "sm" \| "lg" \| "icon" | "default" | No | Button size |
| asChild | boolean | false | No | Merge props into child element |
| className | string | "" | No | Additional CSS classes |
| disabled | boolean | false | No | Disable button interaction |
| onClick | function | - | No | Click event handler |
| children | ReactNode | - | Yes | Button content |

## Variants

### default
- Primary brand color background
- White text
- Used for primary actions

```tsx
<Button variant="default">Primary Action</Button>
```

### destructive
- Red/destructive color
- Used for dangerous actions (delete, remove)

```tsx
<Button variant="destructive">Delete Account</Button>
```

### outline
- Transparent background with border
- Used for secondary actions

```tsx
<Button variant="outline">Cancel</Button>
```

### secondary
- Subtle background color
- Used for less prominent actions

```tsx
<Button variant="secondary">View Details</Button>
```

### ghost
- No background, no border
- Used for subtle actions

```tsx
<Button variant="ghost">Close</Button>
```

### link
- Styled like a hyperlink
- No background, underline on hover

```tsx
<Button variant="link">Learn More</Button>
```

## Sizes

### default
- Standard button size (h-10)
- Most common use case

```tsx
<Button size="default">Standard Button</Button>
```

### sm
- Small button (h-9)
- Used in compact interfaces

```tsx
<Button size="sm">Small Button</Button>
```

### lg
- Large button (h-11)
- Used for prominent CTAs

```tsx
<Button size="lg">Large CTA</Button>
```

### icon
- Square button for icons only (h-10 w-10)
- Used for icon-only actions

```tsx
<Button size="icon">
  <Icon />
</Button>
```

## Usage Examples

### Basic Button
```tsx
import { Button } from "@/components/ui/button";

<Button>Click Me</Button>
```

### With Icon
```tsx
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

<Button>
  <Download className="mr-2 h-4 w-4" />
  Download
</Button>
```

### Loading State
```tsx
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Please wait
</Button>
```

### As Link
```tsx
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

<Button asChild>
  <Link to="/dashboard">Go to Dashboard</Link>
</Button>
```

### With Custom Styling
```tsx
<Button className="w-full" variant="outline" size="lg">
  Full Width Button
</Button>
```

## Design Tokens Used

### Colors
- `bg-primary` - Default variant background
- `text-primary-foreground` - Default variant text
- `bg-destructive` - Destructive variant
- `bg-secondary` - Secondary variant
- `border-input` - Outline variant border

### Spacing
- `h-10` - Default height
- `h-9` - Small height
- `h-11` - Large height
- `px-4 py-2` - Default padding
- `px-3` - Small padding
- `px-8` - Large padding

### Effects
- `hover:bg-primary/90` - Hover state
- `focus-visible:ring-2` - Focus indicator
- `disabled:opacity-50` - Disabled state
- `transition-colors` - Smooth color transitions

## Accessibility

### Features
- ✅ Keyboard accessible (Enter, Space)
- ✅ Focus indicators
- ✅ Disabled state handling
- ✅ ARIA attributes when needed
- ✅ Screen reader friendly

### Best Practices
```tsx
// ✅ GOOD - Descriptive text
<Button>Save Changes</Button>

// ❌ BAD - Vague text
<Button>OK</Button>

// ✅ GOOD - Icon with text
<Button>
  <Icon className="mr-2" />
  Save
</Button>

// ⚠️ ACCEPTABLE - Icon only with aria-label
<Button size="icon" aria-label="Close dialog">
  <X />
</Button>
```

## Component Variants (CVA)

Uses `class-variance-authority` for type-safe variant management:

```typescript
const buttonVariants = cva(
  "base classes",
  {
    variants: {
      variant: { /* variant styles */ },
      size: { /* size styles */ }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)
```

## Related Components
- **Icon atoms** (lucide-react) - Often used inside buttons
- **Link** (react-router-dom) - Can be wrapped with asChild
- **Form** components - Buttons trigger form submissions

## Common Patterns

### Button Group
```tsx
<div className="flex gap-2">
  <Button variant="outline">Cancel</Button>
  <Button>Confirm</Button>
</div>
```

### Responsive Button
```tsx
<Button className="w-full sm:w-auto">
  Responsive Width
</Button>
```

### Form Submit
```tsx
<form onSubmit={handleSubmit}>
  <Button type="submit">Submit Form</Button>
</form>
```

## Testing Considerations
- Test all variants render correctly
- Test all sizes render correctly
- Test click handlers fire
- Test disabled state prevents clicks
- Test keyboard navigation (Tab, Enter, Space)
- Test focus indicators visible
- Test with screen readers

## Known Issues
None currently identified.

## Changelog

### Version 1.0.0
- Initial implementation from shadcn/ui
- All variants and sizes
- Accessibility features
- CVA integration

---

**Last Updated**: 2025-01-26  
**Component Status**: ✅ Stable  
**shadcn/ui**: [Button Documentation](https://ui.shadcn.com/docs/components/button)