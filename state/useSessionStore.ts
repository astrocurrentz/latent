"use client";

import { create } from "zustand";
import type { Locale } from "@/lib/i18n/types";
import { signInWithApple } from "@/lib/native/appleAuth";

interface SessionState {
  userId: string | null;
  locale: Locale;
  signInWithApple: () => Promise<void>;
  setLocale: (locale: Locale) => void;
}

function readCachedUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("latent-user-id");
}

export const useSessionStore = create<SessionState>((set) => ({
  userId: readCachedUserId(),
  locale: "en",
  async signInWithApple() {
    const result = await signInWithApple();
    if (typeof window !== "undefined") {
      window.localStorage.setItem("latent-user-id", result.userId);
    }
    set({ userId: result.userId });
  },
  setLocale(locale) {
    set({ locale });
  }
}));
