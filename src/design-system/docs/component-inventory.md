# UI Component Inventory

This inventory defines the first-pass architecture for a restrained skeuomorphic system.

## Foundation

| Layer | Scope | Notes |
| --- | --- | --- |
| Color tokens | `src/design-system/tokens/colors.ts` | Semantic roles first: surface, border, highlight, shadow, text, accent, state |
| Shadow tokens | `src/design-system/tokens/shadows.ts` | Usage + depth naming only; no random one-off shadows |
| Core CSS variables | `app/design-system.css` | Runtime source of truth for token values |

## Primitive Components

| Component | File | Current Status | Intended Responsibility |
| --- | --- | --- | --- |
| Panel | `src/design-system/components/panel.tsx` | Placeholder | Matte container surfaces with believable depth tiers |
| Button | `src/design-system/components/button.tsx` | Placeholder | Primary, secondary, and ghost action surfaces |
| Knob | `src/design-system/components/knob.tsx` | Placeholder | Rotational analog control shell |
| Slider | `src/design-system/components/slider.tsx` | Placeholder | Linear value control with restrained industrial track |
| Display | `src/design-system/components/display.tsx` | Placeholder | Dark readout area for status/text |
| ScreenWrapper | `src/design-system/components/screen-wrapper.tsx` | First pass | Adaptive framed screen shell with inner glass/shadow layer for viewfinders and readouts |
| Switch | `src/design-system/components/switch.tsx` | Placeholder | Binary control with tactile state feedback |
| LED | `src/design-system/components/led.tsx` | Placeholder | Small state indicator with semantic signal states |
| Label | `src/design-system/components/label.tsx` | Placeholder | Compact, uppercase metadata typography |

## Composition Targets (Next Phase)

| Component | Depends On |
| --- | --- |
| Control Group | Panel + Label + Knob/Slider/Switch |
| Meter Row | Display + LED + Label |
| Inspector Section | Panel + Button + Label |
| Viewfinder Module | ScreenWrapper + Display/overlay primitives |

## Constraints

- Components should consume semantic tokens only.
- Components should be composable and not page-coupled.
- Visual polish can evolve later without changing contracts.
