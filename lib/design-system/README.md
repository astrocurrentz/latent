# Design System Architecture

The active design-system foundation now lives in `src/design-system`.

## Source of truth

1. Runtime CSS variables
- `app/design-system.css`
- Defines semantic color roles and usage-based shadow tokens.

2. Typed token exports
- `src/design-system/tokens/colors.ts`
- `src/design-system/tokens/shadows.ts`

3. Primitive placeholders
- `src/design-system/components/*`
- Panel, Button, Knob, Slider, Display, ScreenWrapper, Switch, LED, Label.

4. Documentation
- `src/design-system/docs/component-inventory.md`
- `src/design-system/docs/visual-rules.md`

5. Preview route
- `/design-system` (`app/design-system/page.tsx`)

## Compatibility

`lib/design-system/*` remains as a lightweight compatibility facade that re-exports token references for existing imports.
