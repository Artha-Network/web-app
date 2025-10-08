# Hero Organism

## Purpose
The Hero component is a full-width landing page hero section that serves as the primary visual entry point for the Artha Network application. It showcases the main value proposition with a compelling headline, descriptive text, and call-to-action buttons.

## Component Type
**Organism** - Complex component composed of multiple atoms and molecules

## Location
`src/components/organisms/Hero.tsx`

## Visual Description
- Full viewport height section with gradient background overlay
- Background image with blockchain network visualization
- Centered content with heading, description, and CTA buttons
- Responsive layout that adapts to mobile, tablet, and desktop

## Props
This component accepts no props - it's a static presentation component.

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| None | - | - | - | This is a static component |

## Composed Of
- **Atoms**:\
  - Button (from `@/components/ui/button`)\
  - Icons (Shield, ArrowRight from lucide-react)
  
- **Molecules**:\
  - Hero heading (h1 + span for gradient text)
  - Description paragraph
  - CTA button group

## Structure
```
Hero
├── Section (full-height container)
│   ├── Background gradient overlay
│   └── Content container
│       ├── Heading
│       │   ├── Main text
│       │   └── Gradient accent text
│       ├── Description paragraph
│       └── CTA Button group
│           ├── Primary button (Get Started)
│           └── Secondary button (Learn More)
```

## Usage

### Basic Usage
```tsx
import Hero from '@/components/organisms/Hero';

function LandingPage() {
  return (
    <div>
      <Hero />
      {/* Other sections */}
    </div>
  );
}
```

### In Page Context
```tsx
import Hero from '@/components/organisms/Hero';
import Features from '@/components/organisms/Features';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      {/* More sections */}
    </div>
  );
};
```

## Design Tokens Used

### Colors
- `text-white` - Primary heading text
- `bg-gradient-primary` - Gradient accent on "Artha Network"
- `text-white/90` - Description text (with opacity)
- `bg-primary` - Primary CTA button background
- `bg-white/10` - Secondary button with transparency
- `border-white/20` - Secondary button border

### Spacing
- `py-20 md:py-32` - Vertical padding (responsive)
- `px-6` - Horizontal padding
- `gap-8` - Spacing between content elements
- `gap-4` - Spacing between buttons

### Typography
- `text-5xl md:text-7xl` - Main heading size (responsive)
- `font-bold` - Heading weight
- `text-xl md:text-2xl` - Description size (responsive)
- `leading-tight` - Heading line height

### Effects
- `bg-gradient-to-br` - Background gradient direction
- `backdrop-blur-sm` - Subtle blur effect on overlay
- Hover effects on buttons (scale, color changes)

## Responsive Behavior

### Mobile (< 768px)
- Stacked vertical layout
- Smaller heading (text-5xl)
- Smaller description (text-xl)
- Full-width buttons
- Reduced padding (py-20)

### Tablet (768px - 1024px)
- Larger heading (text-7xl)
- Larger description (text-2xl)
- Increased padding (py-32)

### Desktop (> 1024px)
- Maximum content width (max-w-4xl)
- Optimal reading line length
- Enhanced visual hierarchy

## Accessibility

### Features
- ✅ Semantic HTML (`<section>`, `<h1>`)
- ✅ Sufficient color contrast (white text on dark background)
- ✅ Descriptive button text ("Get Started", "Learn More")
- ✅ Keyboard navigable (Tab focus on buttons)
- ✅ Screen reader friendly
- ✅ ARIA labels where needed

### Considerations
- Background image is decorative (no alt text needed)
- Focus indicators visible on buttons
- Text remains readable at all zoom levels
- No critical information in images

## Performance

### Optimizations
- Background image lazy-loaded via CSS
- No JavaScript animations (CSS only)
- Minimal re-renders (no props/state)
- Tree-shakeable imports

### Bundle Impact
- ~2KB (component code)
- Shares Button component with rest of app
- No additional dependencies

## SEO Considerations

### Implemented
- ✅ Single `<h1>` tag on page
- ✅ Descriptive heading text with keywords
- ✅ Meaningful content hierarchy
- ✅ No keyword stuffing
- ✅ Natural language description

### Keywords Targeted
- "Decentralized Escrow"
- "AI-Powered Transactions"
- "Blockchain Security"
- "Smart Escrow Platform"

## Related Components

### Used By
- `src/pages/Index.tsx` - Landing page

### Uses
- `@/components/ui/button` - Button atom
- `lucide-react` - Icon atoms (Shield, ArrowRight)

### Similar Components
- None (unique hero section)

## Customization Guide

### Change Heading Text
```tsx
<h1 className="...">
  Your New Heading{" "}
  <span className="bg-gradient-primary bg-clip-text text-transparent">
    Your Accent
  </span>
</h1>
```

### Change CTA Buttons
```tsx
<div className="flex flex-col sm:flex-row gap-4 justify-center">
  <Button size="lg" onClick={() => navigate('/your-route')}>
    <YourIcon className="mr-2" />
    Your CTA Text
  </Button>
</div>
```

### Change Background
```tsx
<section 
  className="..." 
  style={{ backgroundImage: 'url(/path/to/your/image.jpg)' }}
>
```

## Testing Notes

### Visual Regression
- Test at breakpoints: 375px, 768px, 1024px, 1440px
- Verify gradient renders correctly
- Check button hover states
- Verify text readability

### Functional Testing
- Click "Get Started" → Navigate to /get-started
- Click "Learn More" → Navigate to /documentation
- Verify responsive layout at all breakpoints
- Test keyboard navigation (Tab, Enter)

## Known Issues
None currently identified.

## Changelog

### Version 1.0.0 (2025-01-26)
- Initial implementation
- Responsive design
- CTA button integration
- Background image with overlay

---

**Last Updated**: 2025-01-26  
**Maintained By**: Development Team  
**Component Status**: ✅ Stable
