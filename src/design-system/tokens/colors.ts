export type ColorRoleGroup = "surface" | "border" | "highlight" | "shadow" | "text" | "accent" | "state";

export const colorFoundationTokens = {
  neutral: {
    0: "#fbfaf7",
    50: "#f3f1ed",
    100: "#e9e6e1",
    200: "#d7d2ca",
    300: "#bbb5ab",
    400: "#979084",
    500: "#736d63",
    600: "#575249",
    700: "#3f3b35",
    800: "#2f2c27"
  },
  accent: {
    400: "#d58a49",
    500: "#c3793a",
    600: "#a9632f"
  },
  signal: {
    danger: "#9b4f3b",
    warning: "#ad7a33",
    success: "#4f7e54"
  }
} as const;

export const colorTokenVarNames = {
  surface: {
    canvas: "--ds-color-surface-canvas",
    panel: "--ds-color-surface-panel",
    elevated: "--ds-color-surface-elevated",
    sunken: "--ds-color-surface-sunken"
  },
  border: {
    subtle: "--ds-color-border-subtle",
    default: "--ds-color-border-default",
    strong: "--ds-color-border-strong"
  },
  highlight: {
    soft: "--ds-color-highlight-soft",
    edge: "--ds-color-highlight-edge"
  },
  shadow: {
    soft: "--ds-color-shadow-soft",
    key: "--ds-color-shadow-key"
  },
  text: {
    primary: "--ds-color-text-primary",
    secondary: "--ds-color-text-secondary",
    tertiary: "--ds-color-text-tertiary",
    onDark: "--ds-color-text-on-dark"
  },
  accent: {
    primary: "--ds-color-accent-primary",
    muted: "--ds-color-accent-muted",
    strong: "--ds-color-accent-strong"
  },
  state: {
    danger: "--ds-color-state-danger",
    warning: "--ds-color-state-warning",
    success: "--ds-color-state-success"
  }
} as const;

export const colorTokenReferences = {
  surface: {
    canvas: `var(${colorTokenVarNames.surface.canvas})`,
    panel: `var(${colorTokenVarNames.surface.panel})`,
    elevated: `var(${colorTokenVarNames.surface.elevated})`,
    sunken: `var(${colorTokenVarNames.surface.sunken})`
  },
  border: {
    subtle: `var(${colorTokenVarNames.border.subtle})`,
    default: `var(${colorTokenVarNames.border.default})`,
    strong: `var(${colorTokenVarNames.border.strong})`
  },
  highlight: {
    soft: `var(${colorTokenVarNames.highlight.soft})`,
    edge: `var(${colorTokenVarNames.highlight.edge})`
  },
  shadow: {
    soft: `var(${colorTokenVarNames.shadow.soft})`,
    key: `var(${colorTokenVarNames.shadow.key})`
  },
  text: {
    primary: `var(${colorTokenVarNames.text.primary})`,
    secondary: `var(${colorTokenVarNames.text.secondary})`,
    tertiary: `var(${colorTokenVarNames.text.tertiary})`,
    onDark: `var(${colorTokenVarNames.text.onDark})`
  },
  accent: {
    primary: `var(${colorTokenVarNames.accent.primary})`,
    muted: `var(${colorTokenVarNames.accent.muted})`,
    strong: `var(${colorTokenVarNames.accent.strong})`
  },
  state: {
    danger: `var(${colorTokenVarNames.state.danger})`,
    warning: `var(${colorTokenVarNames.state.warning})`,
    success: `var(${colorTokenVarNames.state.success})`
  }
} as const;
