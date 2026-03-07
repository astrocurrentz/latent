import {
  DEFAULT_FRAME_LIMIT,
  LENS_SKUS,
  MAX_SHARED_PARTICIPANTS,
  SKU_CARD_ONE,
  STARTER_FREE_CARDS
} from "@/data/constants";
import type { LensId } from "@/data/lenses";
import type { Card, CardFrame, Inventory, Invite } from "@/lib/domain/models";
import type { LatentStore } from "@/lib/server/store-contract";
import { createServiceClient } from "@/lib/server/supabase";

interface SupabaseError {
  message: string;
}

function unwrapError(error: SupabaseError | null, fallback: string) {
  if (!error) {
    return;
  }
  throw new Error(error.message || fallback);
}

export class SupabaseLatentStore implements LatentStore {
  private client = createServiceClient();

  private ensureClient() {
    if (!this.client) {
      throw new Error("Supabase service credentials are not configured.");
    }

    return this.client;
  }

  private async ensureMembership(cardId: string, userId: string) {
    const client = this.ensureClient();
    const { data, error } = await client
      .from("card_members")
      .select("role")
      .eq("card_id", cardId)
      .eq("user_id", userId)
      .maybeSingle();

    unwrapError(error, "Failed to check card membership.");
    if (!data) {
      throw new Error("User is not a member of this card.");
    }

    return data as { role: "creator" | "contributor" };
  }

  private async ensureStarterInventory(userId: string) {
    const client = this.ensureClient();
    const { error } = await client.rpc("ensure_starter_inventory", {
      p_user_id: userId
    });

    unwrapError(error, "Failed to provision starter inventory.");
  }

  async createCard(input: { userId: string; shared: boolean }): Promise<Card> {
    const client = this.ensureClient();
    await this.ensureStarterInventory(input.userId);

    const { data, error } = await client.rpc("create_card", {
      p_user_id: input.userId,
      p_shared: input.shared
    });

    unwrapError(error, "Failed to create card.");
    return data as Card;
  }

  async getCard(cardId: string, userId: string): Promise<Card> {
    const client = this.ensureClient();
    await this.ensureMembership(cardId, userId);

    const { data, error } = await client.from("cards").select("*").eq("id", cardId).single();
    unwrapError(error, "Card not found.");

    return data as Card;
  }

  async listCardFrames(cardId: string, userId: string): Promise<CardFrame[]> {
    const client = this.ensureClient();
    const card = await this.getCard(cardId, userId);
    if (card.status !== "developed") {
      throw new Error("Card is still latent. Reveal is unavailable.");
    }

    const { data, error } = await client
      .from("card_frames")
      .select("*")
      .eq("card_id", cardId)
      .order("frame_index", { ascending: true });

    unwrapError(error, "Failed to load frames.");
    return (data ?? []) as CardFrame[];
  }

  async createInvite(cardId: string, userId: string): Promise<Invite & { deepLink: string }> {
    const client = this.ensureClient();
    const { data, error } = await client.rpc("create_invite", {
      p_card_id: cardId,
      p_user_id: userId
    });

    unwrapError(error, "Failed to create invite.");

    const invite = data as Invite;
    return {
      ...invite,
      deepLink: `latent://join?code=${invite.code}`
    };
  }

  async joinCard(code: string, userId: string): Promise<Card> {
    const client = this.ensureClient();
    const { data, error } = await client.rpc("join_card", {
      p_code: code,
      p_user_id: userId
    });

    unwrapError(error, "Failed to join card.");
    return data as Card;
  }

  async captureFrame(input: {
    cardId: string;
    userId: string;
    lensId: LensId;
    masterUri: string;
    derivativeUri: string | null;
  }): Promise<{ card: Card; frame: CardFrame }> {
    const client = this.ensureClient();

    const { data, error } = await client.rpc("capture_frame", {
      p_card_id: input.cardId,
      p_user_id: input.userId,
      p_lens_id: input.lensId,
      p_master_uri: input.masterUri,
      p_derivative_uri: input.derivativeUri
    });

    unwrapError(error, "Failed to capture frame.");

    const card = await this.getCard(input.cardId, input.userId);
    return { card, frame: data as CardFrame };
  }

  async developCard(cardId: string, userId: string): Promise<Card> {
    const client = this.ensureClient();
    const { data, error } = await client.rpc("develop_card", {
      p_card_id: cardId,
      p_user_id: userId
    });

    unwrapError(error, "Failed to develop card.");
    return data as Card;
  }

  async getInventory(userId: string): Promise<{ inventory: Inventory; lenses: string[] }> {
    const client = this.ensureClient();
    await this.ensureStarterInventory(userId);

    const [inventoryResult, lensesResult] = await Promise.all([
      client.from("inventory").select("*").eq("user_id", userId).single(),
      client.from("lens_entitlements").select("lens_id").eq("user_id", userId)
    ]);

    unwrapError(inventoryResult.error, "Failed to load inventory.");
    unwrapError(lensesResult.error, "Failed to load lens entitlements.");

    return {
      inventory: inventoryResult.data as Inventory,
      lenses: (lensesResult.data ?? []).map((row) => row.lens_id as string)
    };
  }

  async applyPurchase(input: {
    userId: string;
    productId: string;
    transactionId: string;
  }): Promise<{ applied: boolean; inventory: Inventory; lenses: string[] }> {
    const client = this.ensureClient();

    const { data, error } = await client.rpc("apply_purchase", {
      p_user_id: input.userId,
      p_product_id: input.productId,
      p_transaction_id: input.transactionId
    });

    unwrapError(error, "Failed to apply purchase.");

    const purchaseOutcome = Array.isArray(data) ? data[0] : data;

    const ownedLens = Object.entries(LENS_SKUS).find(([, sku]) => sku === input.productId)?.[0];
    if (ownedLens) {
      const { error: entitlementError } = await client
        .from("lens_entitlements")
        .upsert(
          {
            user_id: input.userId,
            lens_id: ownedLens,
            source_product_id: input.productId,
            transaction_id: input.transactionId
          },
          {
            onConflict: "user_id,lens_id",
            ignoreDuplicates: true
          }
        );

      unwrapError(entitlementError, "Failed to persist lens entitlement.");
    }

    const inventoryState = await this.getInventory(input.userId);

    return {
      applied: Boolean(purchaseOutcome?.applied),
      inventory: inventoryState.inventory,
      lenses: inventoryState.lenses
    };
  }
}

export function hasSupabaseConfiguration() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export const runtimeDefaults = {
  DEFAULT_FRAME_LIMIT,
  MAX_SHARED_PARTICIPANTS,
  STARTER_FREE_CARDS,
  SKU_CARD_ONE
};
