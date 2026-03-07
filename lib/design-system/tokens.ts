export type FoundationColorRole = "accent" | "lightBackground" | "darkBody" | "midGrayShadow";

export const foundationColors: Record<FoundationColorRole, { hex: string; rgb: [number, number, number] }> = {
  accent: { hex: "#DD8943", rgb: [221, 137, 67] },
  lightBackground: { hex: "#E9E7E4", rgb: [233, 231, 228] },
  darkBody: { hex: "#333331", rgb: [51, 51, 49] },
  midGrayShadow: { hex: "#A2A19E", rgb: [162, 161, 158] }
};

export const semanticColorTokens = {
  canvas: "var(--color-canvas)",
  surface: "var(--color-surface)",
  surfaceElevated: "var(--color-surface-elevated)",
  border: "var(--color-border)",
  borderStrong: "var(--color-border-strong)",
  textPrimary: "var(--color-text-primary)",
  textMuted: "var(--color-text-muted)",
  textSubtle: "var(--color-text-subtle)",
  textOnDark: "var(--color-text-on-dark)",
  accent: "var(--color-accent)",
  danger: "var(--color-danger)",
  shadow: "var(--color-shadow)"
} as const;

export const componentTokenGroups = {
  button: {
    primaryBg: "var(--button-primary-bg)",
    secondaryBg: "var(--button-secondary-bg)",
    ghostFg: "var(--button-ghost-fg)",
    dangerBg: "var(--button-danger-bg)"
  },
  badge: {
    bg: "var(--badge-bg)",
    border: "var(--badge-border)",
    fg: "var(--badge-fg)"
  },
  field: {
    bg: "var(--field-bg)",
    border: "var(--field-border)",
    fg: "var(--field-fg)"
  },
  panel: {
    bg: "var(--panel-bg)",
    border: "var(--panel-border)"
  }
} as const;
