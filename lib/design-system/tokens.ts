import { colorFoundationTokens, colorTokenReferences, shadowTokenReferences } from "@/src/design-system/tokens";

export type FoundationColorRole = "accent" | "lightBackground" | "darkBody" | "midGrayShadow";

export const foundationColors: Record<FoundationColorRole, { hex: string; rgb: [number, number, number] }> = {
  accent: { hex: colorFoundationTokens.accent[400], rgb: [213, 138, 73] },
  lightBackground: { hex: colorFoundationTokens.neutral[100], rgb: [233, 230, 225] },
  darkBody: { hex: colorFoundationTokens.neutral[800], rgb: [47, 44, 39] },
  midGrayShadow: { hex: colorFoundationTokens.neutral[400], rgb: [151, 144, 132] }
};

export const semanticColorTokens = {
  canvas: colorTokenReferences.surface.canvas,
  surface: colorTokenReferences.surface.panel,
  surfaceElevated: colorTokenReferences.surface.elevated,
  border: colorTokenReferences.border.default,
  borderStrong: colorTokenReferences.border.strong,
  textPrimary: colorTokenReferences.text.primary,
  textMuted: colorTokenReferences.text.secondary,
  textSubtle: colorTokenReferences.text.tertiary,
  textOnDark: colorTokenReferences.text.onDark,
  accent: colorTokenReferences.accent.primary,
  danger: colorTokenReferences.state.danger,
  shadow: colorTokenReferences.shadow.key
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

export const shadowTokens = shadowTokenReferences;
