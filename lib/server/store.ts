import { randomUUID } from "node:crypto";
import {
  DEFAULT_FRAME_LIMIT,
  LENS_SKUS,
  MAX_SHARED_PARTICIPANTS,
  SKU_CARD_ONE,
  STARTER_FREE_CARDS
} from "@/data/constants";
import { type LensId } from "@/data/lenses";
import { canDevelop, getCardStatus, isLensAllowed, nextFrameIndex } from "@/lib/domain/cards";
import type { Card, CardFrame, CardMember, Inventory, Invite } from "@/lib/domain/models";
import type { ApplyPurchaseInput, CaptureFrameInput, LatentStore } from "@/lib/server/store-contract";
import { hasSupabaseConfiguration, SupabaseLatentStore } from "@/lib/server/supabaseStore";

interface CreateCardInput {
  userId: string;
  shared: boolean;
}

export class InMemoryLatentStore implements LatentStore {
  private readonly cards = new Map<string, Card>();
  private readonly members = new Map<string, CardMember[]>();
  private readonly frames = new Map<string, CardFrame[]>();
  private readonly invitesByCode = new Map<string, Invite>();
  private readonly inventory = new Map<string, Inventory>();
  private readonly entitlements = new Map<string, Set<string>>();
  private readonly purchaseTransactions = new Set<string>();
  private readonly cardLocks = new Map<string, Promise<void>>();

  private async withCardLock<T>(cardId: string, fn: () => Promise<T> | T): Promise<T> {
    const prior = this.cardLocks.get(cardId) ?? Promise.resolve();
    let release: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.cardLocks.set(cardId, prior.then(() => current));

    await prior;
    try {
      return await fn();
    } finally {
      release!();
      if (this.cardLocks.get(cardId) === current) {
        this.cardLocks.delete(cardId);
      }
    }
  }

  private now(): string {
    return new Date().toISOString();
  }

  private ensureMembership(cardId: string, userId: string): CardMember {
    const membership = this.members.get(cardId)?.find((member) => member.userId === userId);
    if (!membership) {
      throw new Error("User is not a member of this card.");
    }

    return membership;
  }

  private ensureInventory(userId: string): Inventory {
    const existing = this.inventory.get(userId);
    if (existing) {
      return existing;
    }

    const created: Inventory = {
      userId,
      cardsRemaining: STARTER_FREE_CARDS,
      starterGrantedAt: this.now()
    };
    this.inventory.set(userId, created);
    return created;
  }

  private lensSet(userId: string): Set<string> {
    const existing = this.entitlements.get(userId);
    if (existing) {
      return existing;
    }

    const created = new Set<string>();
    this.entitlements.set(userId, created);
    return created;
  }

  async createCard(input: CreateCardInput): Promise<Card> {
    this.ensureInventory(input.userId);

    const createdAt = this.now();
    const card: Card = {
      id: randomUUID(),
      ownerId: input.userId,
      frameLimit: DEFAULT_FRAME_LIMIT,
      frameCount: 0,
      status: "active",
      shared: input.shared,
      createdAt,
      updatedAt: createdAt
    };

    this.cards.set(card.id, card);
    this.members.set(card.id, [
      {
        cardId: card.id,
        userId: input.userId,
        role: "creator",
        joinedAt: createdAt
      }
    ]);
    this.frames.set(card.id, []);

    return card;
  }

  async getCard(cardId: string, userId: string): Promise<Card> {
    const card = this.cards.get(cardId);
    if (!card) {
      throw new Error("Card not found.");
    }

    this.ensureMembership(cardId, userId);
    return card;
  }

  async listCardFrames(cardId: string, userId: string): Promise<CardFrame[]> {
    const card = await this.getCard(cardId, userId);
    if (card.status !== "developed") {
      throw new Error("Card is still latent. Reveal is unavailable.");
    }

    return [...(this.frames.get(cardId) ?? [])].sort((a, b) => a.frameIndex - b.frameIndex);
  }

  async createInvite(cardId: string, userId: string): Promise<Invite & { deepLink: string }> {
    const card = await this.getCard(cardId, userId);
    if (!card.shared) {
      throw new Error("Invites are only available for shared cards.");
    }

    const membership = this.ensureMembership(cardId, userId);
    if (membership.role !== "creator") {
      throw new Error("Only card creator can generate invites.");
    }

    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const invite: Invite = {
      id: randomUUID(),
      cardId,
      code,
      createdBy: userId,
      createdAt: this.now(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString()
    };

    this.invitesByCode.set(code, invite);
    return { ...invite, deepLink: `latent://join?code=${code}` };
  }

  async joinCard(code: string, userId: string): Promise<Card> {
    const invite = this.invitesByCode.get(code.toUpperCase());
    if (!invite) {
      throw new Error("Invalid invite code.");
    }

    if (new Date(invite.expiresAt).getTime() < Date.now()) {
      throw new Error("Invite has expired.");
    }

    const card = this.cards.get(invite.cardId);
    if (!card) {
      throw new Error("Card not found.");
    }

    if (!card.shared) {
      throw new Error("Card is not shareable.");
    }

    const members = this.members.get(card.id) ?? [];
    const existing = members.find((member) => member.userId === userId);
    if (existing) {
      return card;
    }

    if (members.length >= MAX_SHARED_PARTICIPANTS) {
      throw new Error(`Shared card capacity is ${MAX_SHARED_PARTICIPANTS} participants.`);
    }

    members.push({
      cardId: card.id,
      userId,
      role: "contributor",
      joinedAt: this.now()
    });
    this.members.set(card.id, members);

    return card;
  }

  async captureFrame(input: CaptureFrameInput): Promise<{ card: Card; frame: CardFrame }> {
    return this.withCardLock(input.cardId, async () => {
      const card = this.cards.get(input.cardId);
      if (!card) {
        throw new Error("Card not found.");
      }

      this.ensureMembership(input.cardId, input.userId);

      if (card.status !== "active") {
        throw new Error("Card cannot accept more frames.");
      }

      const userLenses = this.lensSet(input.userId);
      if (!isLensAllowed(input.lensId as LensId, userLenses)) {
        throw new Error("Lens entitlement required.");
      }

      if (card.frameCount === 0) {
        const ownerInventory = this.ensureInventory(card.ownerId);
        if (ownerInventory.cardsRemaining <= 0) {
          throw new Error("Card inventory depleted for creator.");
        }
        ownerInventory.cardsRemaining -= 1;
      }

      const frameIndex = nextFrameIndex(card.frameCount, card.frameLimit);
      const frame: CardFrame = {
        id: randomUUID(),
        cardId: card.id,
        frameIndex,
        capturedBy: input.userId,
        lensId: input.lensId,
        masterUri: input.masterUri,
        derivativeUri: input.derivativeUri,
        createdAt: this.now()
      };

      const existingFrames = this.frames.get(card.id) ?? [];
      if (existingFrames.some((item) => item.frameIndex === frame.frameIndex)) {
        throw new Error("Duplicate frame index conflict.");
      }
      existingFrames.push(frame);
      this.frames.set(card.id, existingFrames);

      card.frameCount = frameIndex;
      card.status = getCardStatus(card.frameCount, card.frameLimit);
      card.updatedAt = this.now();

      return { card, frame };
    });
  }

  async developCard(cardId: string, userId: string): Promise<Card> {
    return this.withCardLock(cardId, async () => {
      const card = await this.getCard(cardId, userId);
      if (!canDevelop(card.status, card.frameCount, card.frameLimit)) {
        throw new Error("Card is not developable yet.");
      }

      card.status = "developed";
      card.updatedAt = this.now();
      return card;
    });
  }

  async getInventory(userId: string): Promise<{ inventory: Inventory; lenses: string[] }> {
    const inventory = this.ensureInventory(userId);
    return {
      inventory,
      lenses: [...this.lensSet(userId)]
    };
  }

  async applyPurchase(input: ApplyPurchaseInput): Promise<{ applied: boolean; inventory: Inventory; lenses: string[] }> {
    const dedupeKey = `${input.userId}:${input.transactionId}`;
    const inventory = this.ensureInventory(input.userId);
    const lenses = this.lensSet(input.userId);

    if (this.purchaseTransactions.has(dedupeKey)) {
      return { applied: false, inventory, lenses: [...lenses] };
    }

    if (input.productId === SKU_CARD_ONE) {
      inventory.cardsRemaining += 1;
    }

    const lensEntry = Object.entries(LENS_SKUS).find(([, sku]) => sku === input.productId);
    if (lensEntry) {
      lenses.add(lensEntry[0]);
    }

    this.purchaseTransactions.add(dedupeKey);

    return { applied: true, inventory, lenses: [...lenses] };
  }
}

let singleton: LatentStore | undefined;

export function getStore(): LatentStore {
  if (!singleton) {
    singleton = hasSupabaseConfiguration() ? new SupabaseLatentStore() : new InMemoryLatentStore();
  }

  return singleton;
}
