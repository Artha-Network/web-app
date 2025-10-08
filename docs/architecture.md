# Web App Architecture

This project follows Atomic Design (atoms → molecules → organisms → templates → pages).

- Atoms: Minimal UI primitives. We re-expose shared UI (shadcn/radix-based) atoms under `src/atoms` for consistent imports.
- Molecules: Small compositions like `FormField`.
- Organisms: Larger sections like `EscrowFlow`, `CreateEscrowForm`.
- Templates: Layout scaffolds like `BaseLayout`.
- Pages: Route-level screens composed from templates + organisms.

See also: `ARCHITECTURE.md` in the project root of web-app.

### Updates
- v1.0.0 — Initial creation

