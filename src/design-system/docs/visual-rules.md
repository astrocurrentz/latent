# Visual Rules (First Pass)

## Direction

- Restrained skeuomorphism, not nostalgia styling.
- Industrial minimalism with matte surfaces and subtle highlights.
- Depth should support hierarchy, never act as decoration.

## Token Rules

- Always start from semantic roles before component styles.
- Keep roles explicit: `surface`, `border`, `highlight`, `shadow`, `text`, `accent`, `state`.
- Avoid arbitrary names and one-off overrides.

## Surface & Depth

- Default surfaces are low-contrast matte neutrals.
- Elevated surfaces use the raised shadow token only when needed for hierarchy.
- Sunken surfaces are reserved for display wells, tracks, and recessed controls.

## ScreenWrapper Rules

- Use `ScreenWrapper` for framed displays and viewfinder windows.
- Keep frame treatment subtle: one outer shell, one recessed screen layer.
- Prefer CSS gradient + vector-like grain overlays; avoid bitmap textures.
- Put readable text/content inside the recessed screen layer only.

## Border & Highlight

- Borders define form; highlights define material edge response.
- Use highlights sparingly and consistently to keep forms believable.

## Interaction

- Rest/hover/pressed states should communicate function clearly.
- Pressed states should reduce apparent elevation.
- Focus states should prioritize accessibility over dramatic effects.

## Implementation Guardrails

- Prefer CSS and small vector-like primitives.
- No bitmap-heavy texture dependencies.
- Keep first-pass components structurally correct; refine visuals incrementally.

## Viewfinder Layout Knobs

Tune these CSS variables in `app/design-system.css` to reposition/resize the native viewfinder without touching component logic:

- `--ds-layout-safe-pad-top`
- `--ds-layout-safe-pad-left`
- `--ds-layout-safe-pad-right`
- `--ds-layout-safe-pad-bottom`
- `--ds-layout-left-rail-width`
- `--ds-layout-viewfinder-offset-top`
- `--ds-layout-viewfinder-offset-left`
- `--ds-layout-viewfinder-width`
- `--ds-layout-viewfinder-aspect` (set to `4 / 3` for horizontal framing)
- `--ds-layout-viewfinder-frame-pad`
- `--ds-layout-viewfinder-frame-radius`
- `--ds-layout-viewfinder-screen-radius`
- `--ds-layout-viewfinder-screen-inset` (increase to reveal more recessed inner layer)
