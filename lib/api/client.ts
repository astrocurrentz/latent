import type { LensId } from "@/data/lenses";
import { LENS_SKUS, SKU_CARD_ONE } from "@/data/constants";
import type { Card, CardFrame } from "@/lib/domain/models";

export interface InventoryResponse {
  inventory: {
    userId: string;
    cardsRemaining: number;
    starterGrantedAt: string;
  };
  lenses: string[];
}

interface RequestOptions extends RequestInit {
  userId: string;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

async function apiFetch<T>(path: string, options: RequestOptions): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      "content-type": "application/json",
      "x-user-id": options.userId,
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({ error: response.statusText }))) as { error?: string };
    throw new Error(body.error ?? "Request failed");
  }

  return (await response.json()) as T;
}

export async function createCard(userId: string, shared: boolean) {
  return apiFetch<{ card: Card }>("/api/cards", {
    method: "POST",
    userId,
    body: JSON.stringify({ shared })
  });
}

export async function getCard(userId: string, cardId: string) {
  return apiFetch<{ card: Card }>(`/api/cards/${cardId}`, {
    method: "GET",
    userId
  });
}

export async function createInvite(userId: string, cardId: string) {
  return apiFetch<{ invite: { code: string; deepLink: string } }>(`/api/cards/${cardId}/invite`, {
    method: "POST",
    userId
  });
}

export async function joinCard(userId: string, code: string) {
  return apiFetch<{ card: Card }>("/api/cards/join", {
    method: "POST",
    userId,
    body: JSON.stringify({ code })
  });
}

export async function captureFrame(input: {
  userId: string;
  cardId: string;
  lensId: LensId;
  masterUri: string;
  derivativeUri: string | null;
}) {
  return apiFetch<{ card: Card; frame: CardFrame }>(`/api/cards/${input.cardId}/frames`, {
    method: "POST",
    userId: input.userId,
    body: JSON.stringify({
      lensId: input.lensId,
      masterUri: input.masterUri,
      derivativeUri: input.derivativeUri
    })
  });
}

export async function developCard(userId: string, cardId: string) {
  return apiFetch<{ card: Card }>(`/api/cards/${cardId}/develop`, {
    method: "POST",
    userId
  });
}

export async function revealCard(userId: string, cardId: string) {
  return apiFetch<{ frames: CardFrame[] }>(`/api/cards/${cardId}/reveal`, {
    method: "GET",
    userId
  });
}

export async function getInventory(userId: string) {
  return apiFetch<InventoryResponse>("/api/me/inventory", {
    method: "GET",
    userId
  });
}

export async function applyCardPurchase(userId: string, transactionId = crypto.randomUUID()) {
  return apiFetch<InventoryResponse & { applied: boolean }>("/api/purchases/apply", {
    method: "POST",
    userId,
    body: JSON.stringify({
      productId: SKU_CARD_ONE,
      transactionId
    })
  });
}

export async function applyLensPurchase(userId: string, lensId: LensId, transactionId = crypto.randomUUID()) {
  const productId = LENS_SKUS[lensId];
  if (!productId) {
    throw new Error("This lens is free or unavailable for purchase.");
  }

  return apiFetch<InventoryResponse & { applied: boolean }>("/api/purchases/apply", {
    method: "POST",
    userId,
    body: JSON.stringify({
      productId,
      transactionId
    })
  });
}
