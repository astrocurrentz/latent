"use client";

import { create } from "zustand";
import type { Card } from "@/lib/domain/models";
import type { LensId } from "@/data/lenses";

interface CardUiState {
  activeCard: Card | null;
  selectedLens: LensId;
  inviteCodeInput: string;
  lastInviteCode: string | null;
  setActiveCard: (card: Card | null) => void;
  setSelectedLens: (lensId: LensId) => void;
  setInviteCodeInput: (code: string) => void;
  setLastInviteCode: (code: string | null) => void;
}

export const useCardUiStore = create<CardUiState>((set) => ({
  activeCard: null,
  selectedLens: "plain",
  inviteCodeInput: "",
  lastInviteCode: null,
  setActiveCard(card) {
    set({ activeCard: card });
  },
  setSelectedLens(lensId) {
    set({ selectedLens: lensId });
  },
  setInviteCodeInput(code) {
    set({ inviteCodeInput: code });
  },
  setLastInviteCode(code) {
    set({ lastInviteCode: code });
  }
}));
