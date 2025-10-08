# Component Documentation Guide

## Overview
Every component in this project requires two documentation files:
1. **Markdown (.md)** - Human-readable documentation
2. **JSON (.json)** - Machine-readable specifications

This dual documentation system ensures clarity, prevents drift, and provides a single source of truth.

## File Structure

```
src/components/
├── atoms/
│   ├── ui/
│   │   ├── button.tsx
│   │   └── ...
│   └── docs/
│       ├── Button.md
│       ├── Button.json
│       └── ...
├── molecules/
│   ├── SomeComponent.tsx
│   └── docs/
│       ├── SomeComponent.md
│       └── SomeComponent.json
├── organisms/
│   ├── Hero.tsx
│   └── docs/
│       ├── Hero.md
│       └── Hero.json
└── templates/
    └── docs/
```

## Markdown Documentation Template

Create `ComponentName.md`:

```markdown
# ComponentName [Atom/Molecule/Organism/Template]

## Purpose
Brief description of what the component does and why it exists.

## Component Type
**[Atom/Molecule/Organism/Template]** - Explanation

## Location
`src/components/.../ComponentName.tsx`

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| propName | string | "" | Yes | What it does |

## Composed Of
List atoms/molecules used in this component

## Structure
Visual component tree

## Usage

\`\`\`tsx
import ComponentName from '@/components/.../ComponentName';

<ComponentName prop="value" />
\`\`\`

## Design Tokens Used
List colors, spacing, typography used

## Responsive Behavior
How it adapts to screen sizes

## Accessibility
WCAG compliance, keyboard navigation, ARIA labels

## Related Components
Components that use this or are similar

## Testing Notes
What to test

## Known Issues
Any current limitations

## Changelog
Version history

---

**Last Updated**: YYYY-MM-DD  
**Component Status**: [Draft/Stable/Deprecated]
```

## JSON Specification Template

Create `ComponentName.json`:

```json
{
  "name": "ComponentName",
  "type": "atom|molecule|organism|template",
  "category": "interactive|layout|marketing|navigation|etc",
  "description": "Brief description",
  "filePath": "src/components/.../ComponentName.tsx",
  "version": "1.0.0",
  "status": "draft|stable|deprecated",
  "props": [
    {
      "name": "propName",
      "type": "string",
      "required": true,
      "default": "",
      "description": "What it does"
    }
  ],
  "composition": {
    "atoms": [
      {
        "name": "Button",
        "import": "@/components/ui/button",
        "usage": "CTA button"
      }
    ],
    "molecules": []
  },
  "dependencies": {
    "internal": ["@/components/ui/button"],
    "external": ["lucide-react"]
  },
  "designTokens": {
    "colors": ["bg-primary", "text-foreground"],
    "spacing": ["p-4", "gap-2"],
    "typography": ["text-lg", "font-bold"],
    "effects": ["hover:scale-105"]
  },
  "responsive": {
    "breakpoints": {
      "mobile": {
        "maxWidth": "767px",
        "features": ["Stack layout"]
      },
      "tablet": {
        "minWidth": "768px",
        "features": ["Grid layout"]
      }
    }
  },
  "accessibility": {
    "wcagLevel": "AA",
    "features": ["Keyboard accessible", "Screen reader friendly"],
    "ariaLabels": ["aria-label=\"Description\""],
    "keyboardNavigation": true
  },
  "performance": {
    "bundleSize": "~XKB",
    "renderComplexity": "low|medium|high",
    "memoizable": true
  },
  "examples": [
    {
      "title": "Basic usage",
      "code": "<ComponentName />"
    }
  ],
  "testing": {
    "visualTests": ["Renders correctly"],
    "functionalTests": ["Click works"],
    "accessibilityTests": ["Tab navigation"]
  },
  "relatedComponents": [
    {
      "name": "OtherComponent",
      "relationship": "uses|sibling|parent",
      "description": "How they relate"
    }
  ],
  "knownIssues": [],
  "changelog": [
    {
      "version": "1.0.0",
      "date": "YYYY-MM-DD",
      "changes": ["Initial implementation"]
    }
  ],
  "maintainers": ["Team Name"],
  "lastUpdated": "YYYY-MM-DD"
}
```

## When to Create Documentation

### For New Components
1. **Before implementation**: Create docs first to plan
2. **During implementation**: Update as you build
3. **After implementation**: Verify completeness

### For Existing Components
1. **Priority**: Start with most-used components
2. **Work up**: Document atoms, then molecules, organisms, templates
3. **Batch similar**: Document all buttons together, all cards together, etc.

## Documentation Checklist

### Markdown (.md)
- [ ] Component name and type
- [ ] Clear purpose statement
- [ ] Complete props table
- [ ] Usage examples
- [ ] Design tokens listed
- [ ] Accessibility features
- [ ] Responsive behavior
- [ ] Related components
- [ ] Testing notes

### JSON (.json)
- [ ] All props with types
- [ ] Composition breakdown
- [ ] Dependencies listed
- [ ] Design tokens categorized
- [ ] Responsive breakpoints
- [ ] Accessibility features
- [ ] Performance metrics
- [ ] Examples array
- [ ] Testing requirements

## Best Practices

### Writing Markdown Docs

1. **Be Clear**: Write for developers who've never seen the component
2. **Show Examples**: Include multiple usage examples
3. **Visual Structure**: Use component trees to show composition
4. **Be Specific**: "Click the button" not "Interact with the UI"
5. **Keep Updated**: Update when component changes

### Writing JSON Specs

1. **Be Precise**: Use exact type definitions
2. **Be Complete**: List all props, even optional ones
3. **Be Consistent**: Follow the template structure
4. **Be Accurate**: JSON must match actual implementation
5. **Version Everything**: Track changes with changelog

### Maintenance

1. **Update on Change**: When component changes, update docs
2. **Review Regularly**: Quarterly doc reviews
3. **Validate**: Ensure JSON matches code
4. **Deprecate Properly**: Mark old versions clearly
5. **Archive**: Keep history of major changes

## Benefits

### For Developers
- Quick reference without reading code
- Clear API documentation
- Usage examples readily available
- Understanding component relationships

### For Teams
- Onboarding new members faster
- Consistent component usage
- Easier code reviews
- Better collaboration

### For Project
- Single source of truth
- Prevents implementation drift
- Enables automated tooling
- Better maintainability

## Tools Integration

### Potential Tooling
- **Storybook**: Generate stories from JSON
- **Documentation Site**: Auto-generate from .md files
- **Type Generation**: Generate TypeScript types from JSON
- **Testing**: Generate test scaffolds from specs
- **Validation**: Ensure code matches spec

## Example Workflow

### Creating a New Component

1. **Plan**: Write .md and .json first
2. **Review**: Team reviews documentation
3. **Implement**: Build component following spec
4. **Test**: Test against JSON specification
5. **Verify**: Ensure docs match implementation
6. **Publish**: Merge with complete documentation

### Updating Existing Component

1. **Change Code**: Make necessary changes
2. **Update Docs**: Modify both .md and .json
3. **Increment Version**: Update version in JSON
4. **Add Changelog**: Document what changed
5. **Review**: Ensure consistency
6. **Merge**: Complete with updated docs

## Common Pitfalls

### Avoid
- ❌ Writing docs after implementation (do it first!)
- ❌ Incomplete prop documentation
- ❌ Missing usage examples
- ❌ Outdated documentation
- ❌ Vague descriptions
- ❌ Skipping accessibility section
- ❌ No responsive behavior notes
- ❌ Missing design tokens

### Instead
- ✅ Write docs first or alongside code
- ✅ Document every prop with types
- ✅ Provide multiple usage examples
- ✅ Update docs with code changes
- ✅ Clear, specific descriptions
- ✅ Detailed accessibility features
- ✅ Complete responsive documentation
- ✅ List all design tokens used

## Questions?

If unsure about documentation:
1. Look at existing examples (Hero.md, Button.md)
2. Follow the templates above
3. Ask team for review
4. Better to over-document than under-document

---

**Remember**: Good documentation prevents bugs, speeds up development, and makes collaboration easier!