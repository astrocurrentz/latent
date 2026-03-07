import en from "@/data/messages.en.json";
import zhHans from "@/data/messages.zh-Hans.json";
import zhHant from "@/data/messages.zh-Hant.json";
import type { Locale } from "@/lib/i18n/types";

export type MessageMap = Record<string, string>;

export const MESSAGES: Record<Locale, MessageMap> = {
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant
};
