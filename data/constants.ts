import type { LensId } from "@/data/lenses";

export const DEFAULT_FRAME_LIMIT = 24;
export const STARTER_FREE_CARDS = 3;
export const MAX_SHARED_PARTICIPANTS = 6;
export const CARD_PRICE_USD = 0.59;

export const SKU_CARD_ONE = "card_1_059";

export const LENS_SKUS: Partial<Record<LensId, string>> = {
  ascii: "lens_ascii_lifetime",
  glitched: "lens_glitched_lifetime",
  halftone: "lens_halftone_lifetime",
  night: "lens_night_lifetime",
  thermal: "lens_thermal_lifetime",
  "x-ray": "lens_xray_lifetime"
};
