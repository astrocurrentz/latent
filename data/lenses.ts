export const FREE_LENS = "plain";

export const LENSES = [
  { id: "plain", labelKey: "lens.plain", premium: false },
  { id: "kodak_gold", labelKey: "lens.kodakGold", premium: true },
  { id: "bw", labelKey: "lens.bw", premium: true },
  { id: "ascii", labelKey: "lens.ascii", premium: true },
  { id: "glitch", labelKey: "lens.glitch", premium: true },
  { id: "thermal", labelKey: "lens.thermal", premium: true }
] as const;

export type LensId = (typeof LENSES)[number]["id"];
