export type ShadowUsage = "surface" | "control" | "display" | "focus";

export const shadowTokenVarNames = {
  surface: {
    rest: "--ds-shadow-surface-rest",
    raised: "--ds-shadow-surface-raised",
    sunken: "--ds-shadow-surface-sunken"
  },
  control: {
    rest: "--ds-shadow-control-rest",
    pressed: "--ds-shadow-control-pressed"
  },
  display: {
    inset: "--ds-shadow-display-inset"
  },
  focus: {
    ring: "--ds-shadow-focus-ring"
  }
} as const;

export const shadowTokenReferences = {
  surface: {
    rest: `var(${shadowTokenVarNames.surface.rest})`,
    raised: `var(${shadowTokenVarNames.surface.raised})`,
    sunken: `var(${shadowTokenVarNames.surface.sunken})`
  },
  control: {
    rest: `var(${shadowTokenVarNames.control.rest})`,
    pressed: `var(${shadowTokenVarNames.control.pressed})`
  },
  display: {
    inset: `var(${shadowTokenVarNames.display.inset})`
  },
  focus: {
    ring: `var(${shadowTokenVarNames.focus.ring})`
  }
} as const;

export const shadowTokenDefinitions = {
  [shadowTokenVarNames.surface.rest]:
    "0 1px 1px var(--ds-color-shadow-soft), 0 6px 14px -8px var(--ds-color-shadow-key), inset 0 1px 0 var(--ds-color-highlight-soft)",
  [shadowTokenVarNames.surface.raised]:
    "0 2px 3px var(--ds-color-shadow-soft), 0 14px 26px -12px var(--ds-color-shadow-key), inset 0 1px 0 var(--ds-color-highlight-edge)",
  [shadowTokenVarNames.surface.sunken]: "inset 0 1px 2px var(--ds-color-shadow-soft), inset 0 -1px 0 var(--ds-color-highlight-soft)",
  [shadowTokenVarNames.control.rest]:
    "0 1px 1px var(--ds-color-shadow-soft), 0 4px 10px -8px var(--ds-color-shadow-key), inset 0 1px 0 var(--ds-color-highlight-edge)",
  [shadowTokenVarNames.control.pressed]: "inset 0 1px 2px var(--ds-color-shadow-key), inset 0 -1px 0 var(--ds-color-highlight-soft)",
  [shadowTokenVarNames.display.inset]: "inset 0 2px 4px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
  [shadowTokenVarNames.focus.ring]: "0 0 0 2px color-mix(in srgb, var(--ds-color-accent-muted) 46%, transparent)"
} as const;
