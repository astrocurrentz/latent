# Design System Architecture

This project uses a centralized three-layer design system:

1. Foundation tokens
- Source of truth for raw brand values.
- Defined in `app/design-system.css` and mirrored in `lib/design-system/tokens.ts`.
- Current base palette:
  - Accent `#DD8943`
  - Light background `#E9E7E4`
  - Dark body `#333331`
  - Mid gray shadow `#A2A19E`

2. Semantic tokens
- Usage-oriented aliases (`--color-text-muted`, `--color-border`, `--color-surface`).
- Decouples component styling from raw brand colors.

3. Component tokens
- Final variables consumed by UI primitives (`--button-primary-bg`, `--badge-bg`, `--panel-bg`, `--field-bg`).
- Components only depend on component tokens, not raw color values.

## Runtime usage
- Global CSS wiring: `app/globals.css` imports `app/design-system.css`.
- UI components use CSS-variable-backed classes:
  - `components/ui/button.tsx`
  - `components/ui/badge.tsx`
  - `components/ui/panel.tsx`
- Screen-level helpers are exposed as utility classes in `app/design-system.css`:
  - `ui-text-muted`, `ui-text-subtle`, `ui-text-accent`, `ui-text-danger`
  - `ui-input`, `ui-select`, `ui-card`, `ui-overlay-chip`

## Extending safely
- Add new color values only in foundation tokens.
- Add semantic aliases before introducing component-level variables.
- Keep components mapped to component tokens to avoid hardcoded palette drift.
