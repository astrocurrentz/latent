export const FREE_LENS = "plain";

export const LENSES = [
  { id: "plain", labelKey: "lens.plain", premium: false },
  { id: "ascii", labelKey: "lens.ascii", premium: false },
  { id: "glitched", labelKey: "lens.glitched", premium: false },
  { id: "halftone", labelKey: "lens.halftone", premium: false },
  { id: "night", labelKey: "lens.night", premium: false },
  { id: "thermal", labelKey: "lens.thermal", premium: false },
  { id: "x-ray", labelKey: "lens.xRay", premium: false }
] as const;

export type LensId = (typeof LENSES)[number]["id"];
