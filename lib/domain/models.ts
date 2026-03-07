import type { LensId } from "@/data/lenses";

export type CardStatus = "active" | "developable" | "developed";
export type MemberRole = "creator" | "contributor";

export interface Card {
  id: string;
  ownerId: string;
  frameLimit: number;
  frameCount: number;
  status: CardStatus;
  shared: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CardMember {
  cardId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface CardFrame {
  id: string;
  cardId: string;
  frameIndex: number;
  capturedBy: string;
  lensId: LensId;
  masterUri: string;
  derivativeUri: string | null;
  createdAt: string;
}

export interface Invite {
  id: string;
  cardId: string;
  code: string;
  createdBy: string;
  expiresAt: string;
  createdAt: string;
}

export interface Inventory {
  userId: string;
  cardsRemaining: number;
  starterGrantedAt: string;
}
