import { Converter } from "opencc-js";
import { MESSAGES } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/types";

const toTraditional = Converter({ from: "cn", to: "tw" });

export function translate(locale: Locale, key: string): string {
  const primary = MESSAGES[locale][key];
  if (primary) {
    return primary;
  }

  if (locale === "zh-Hant") {
    const fallback = MESSAGES["zh-Hans"][key];
    if (fallback) {
      return toTraditional(fallback);
    }
  }

  return MESSAGES.en[key] ?? key;
}
