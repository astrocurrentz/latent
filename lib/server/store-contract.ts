import type { LensId } from "@/data/lenses";
import type { Card, CardFrame, Inventory, Invite } from "@/lib/domain/models";

export interface CaptureFrameInput {
  cardId: string;
  userId: string;
  lensId: LensId;
  masterUri: string;
  derivativeUri: string | null;
}

export interface ApplyPurchaseInput {
  userId: string;
  productId: string;
  transactionId: string;
}

export interface LatentStore {
  createCard(input: { userId: string; shared: boolean }): Promise<Card>;
  getCard(cardId: string, userId: string): Promise<Card>;
  listCardFrames(cardId: string, userId: string): Promise<CardFrame[]>;
  createInvite(cardId: string, userId: string): Promise<Invite & { deepLink: string }>;
  joinCard(code: string, userId: string): Promise<Card>;
  captureFrame(input: CaptureFrameInput): Promise<{ card: Card; frame: CardFrame }>;
  developCard(cardId: string, userId: string): Promise<Card>;
  getInventory(userId: string): Promise<{ inventory: Inventory; lenses: string[] }>;
  applyPurchase(input: ApplyPurchaseInput): Promise<{ applied: boolean; inventory: Inventory; lenses: string[] }>;
}
