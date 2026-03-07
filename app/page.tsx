"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { LENS_SKUS, SKU_CARD_ONE } from "@/data/constants";
import { LENSES, FREE_LENS, type LensId } from "@/data/lenses";
import {
  applyCardPurchase,
  applyLensPurchase,
  captureFrame,
  createCard,
  createInvite,
  developCard,
  getInventory,
  joinCard,
  revealCard
} from "@/lib/api/client";
import { translate } from "@/lib/i18n";
import type { CardFrame } from "@/lib/domain/models";
import { LatentViewfinder, type LatentViewfinderHandle } from "@/components/camera/latent-viewfinder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useCardUiStore } from "@/state/useCardUiStore";
import { useSessionStore } from "@/state/useSessionStore";
import { configureRevenueCat, purchaseProduct } from "@/lib/native/revenuecat";

export default function HomePage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [revealedFrames, setRevealedFrames] = useState<CardFrame[]>([]);
  const viewfinderRef = useRef<LatentViewfinderHandle | null>(null);

  const userId = useSessionStore((state) => state.userId);
  const locale = useSessionStore((state) => state.locale);
  const signInWithApple = useSessionStore((state) => state.signInWithApple);
  const setLocale = useSessionStore((state) => state.setLocale);

  const activeCard = useCardUiStore((state) => state.activeCard);
  const selectedLens = useCardUiStore((state) => state.selectedLens);
  const inviteCodeInput = useCardUiStore((state) => state.inviteCodeInput);
  const lastInviteCode = useCardUiStore((state) => state.lastInviteCode);
  const setInviteCodeInput = useCardUiStore((state) => state.setInviteCodeInput);
  const setActiveCard = useCardUiStore((state) => state.setActiveCard);
  const setSelectedLens = useCardUiStore((state) => state.setSelectedLens);
  const setLastInviteCode = useCardUiStore((state) => state.setLastInviteCode);

  const t = useMemo(() => (key: string) => translate(locale, key), [locale]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_IOS_PUBLIC_KEY;
    if (!apiKey) {
      return;
    }

    void configureRevenueCat(apiKey, userId).catch((err: Error) => setError(err.message));
  }, [userId]);

  const inventoryQuery = useQuery({
    queryKey: ["inventory", userId],
    queryFn: () => getInventory(userId!),
    enabled: Boolean(userId)
  });

  const createCardMutation = useMutation({
    mutationFn: async (shared: boolean) => {
      if (!userId) {
        throw new Error("Please sign in first.");
      }
      return createCard(userId, shared);
    },
    onSuccess(data) {
      setError(null);
      setActiveCard(data.card);
      setRevealedFrames([]);
    },
    onError(err: Error) {
      setError(err.message);
    }
  });

  const joinCardMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!userId) {
        throw new Error("Please sign in first.");
      }
      return joinCard(userId, code);
    },
    onSuccess(data) {
      setActiveCard(data.card);
      setRevealedFrames([]);
      setInviteCodeInput("");
      setError(null);
    },
    onError(err: Error) {
      setError(err.message);
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !activeCard) {
        throw new Error("Create or join a shared card first.");
      }
      return createInvite(userId, activeCard.id);
    },
    onSuccess(data) {
      setLastInviteCode(data.invite.code);
      setError(null);
    },
    onError(err: Error) {
      setError(err.message);
    }
  });

  const captureMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !activeCard) {
        throw new Error("No active card.");
      }

      if (activeCard.shared && !navigator.onLine) {
        throw new Error("Shared cards require network connectivity.");
      }

      if (!viewfinderRef.current) {
        throw new Error("Viewfinder is unavailable.");
      }

      const capture = await viewfinderRef.current.captureFrame(selectedLens);
      return captureFrame({
        userId,
        cardId: activeCard.id,
        lensId: selectedLens,
        masterUri: capture.masterUri,
        derivativeUri: capture.derivativeUri
      });
    },
    onSuccess(data) {
      setActiveCard(data.card);
      queryClient.invalidateQueries({ queryKey: ["inventory", userId] });
      setError(null);
    },
    onError(err: Error) {
      setError(err.message);
    }
  });

  const developMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !activeCard) {
        throw new Error("No active card.");
      }
      return developCard(userId, activeCard.id);
    },
    onSuccess(data) {
      setActiveCard(data.card);
      setError(null);
    },
    onError(err: Error) {
      setError(err.message);
    }
  });

  const revealMutation = useMutation({
    mutationFn: async () => {
      if (!userId || !activeCard) {
        throw new Error("No active card.");
      }
      return revealCard(userId, activeCard.id);
    },
    onSuccess(data) {
      setRevealedFrames(data.frames);
      setError(null);
    },
    onError(err: Error) {
      setError(err.message);
    }
  });

  const buyCardMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error("Please sign in first.");
      }
      const purchase = await purchaseProduct(SKU_CARD_ONE);
      return applyCardPurchase(userId, purchase.transactionId);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["inventory", userId] });
      setError(null);
    },
    onError(err: Error) {
      setError(err.message);
    }
  });

  const buyLensMutation = useMutation({
    mutationFn: async (lensId: LensId) => {
      if (!userId) {
        throw new Error("Please sign in first.");
      }
      const productId = LENS_SKUS[lensId];
      if (!productId) {
        throw new Error("Lens does not require purchase.");
      }
      const purchase = await purchaseProduct(productId);
      return applyLensPurchase(userId, lensId, purchase.transactionId);
    },
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["inventory", userId] });
      setError(null);
    },
    onError(err: Error) {
      setError(err.message);
    }
  });

  const ownedLensIds = new Set([FREE_LENS, ...(inventoryQuery.data?.lenses ?? [])]);

  return (
    <main className="landscape-shell">
      <section className="landscape-warning">
        <h1 className="mb-2 text-xl font-semibold">{t("app.title")}</h1>
        <p className="ui-text-muted text-sm">{t("orientation.landscapeRequired")}</p>
      </section>

      <section className="control-panel">
        <div className="flex flex-col gap-3">
          <LatentViewfinder ref={viewfinderRef} />
          <Panel>
            <div className="mb-2 flex items-center justify-between">
              <span className="ui-text-muted text-xs uppercase tracking-[0.12em]">{t("inventory.cards")}</span>
              <Badge className="mono">{inventoryQuery.data?.inventory.cardsRemaining ?? "-"}</Badge>
            </div>
            <Button onClick={() => buyCardMutation.mutate()} className="w-full" variant="secondary">
              {t("inventory.buy")}
            </Button>
          </Panel>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Panel className="col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">{t("app.title")}</h1>
                <p className="ui-text-subtle text-sm">{t("app.subtitle")}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={locale}
                  onChange={(event) => setLocale(event.target.value as "en" | "zh-Hans" | "zh-Hant")}
                  className="ui-select px-2 py-1 text-sm"
                >
                  <option value="en">EN</option>
                  <option value="zh-Hans">简体</option>
                  <option value="zh-Hant">繁體</option>
                </select>
                <Button
                  onClick={() => signInWithApple().catch((err: Error) => setError(err.message))}
                  variant={userId ? "secondary" : "primary"}
                >
                  {userId ? userId.slice(0, 10) : t("auth.apple")}
                </Button>
              </div>
            </div>
            {error ? <p className="ui-text-danger text-sm">{error}</p> : null}
          </Panel>

          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">Cards</h2>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => createCardMutation.mutate(false)}>
                {t("card.create")} ({t("card.private")})
              </Button>
              <Button variant="secondary" onClick={() => createCardMutation.mutate(true)}>
                {t("card.create")} ({t("card.shared")})
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                placeholder="INVITE CODE"
                value={inviteCodeInput}
                onChange={(event) => setInviteCodeInput(event.target.value.toUpperCase())}
                className="ui-input mono w-full px-2 py-1 text-sm"
              />
              <Button onClick={() => joinCardMutation.mutate(inviteCodeInput)}>{t("card.join")}</Button>
            </div>
            {lastInviteCode ? <p className="ui-text-accent mono mt-2 text-xs">Invite: {lastInviteCode}</p> : null}
          </Panel>

          <Panel>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">Card State</h2>
            {activeCard ? (
              <>
                <p className="ui-text-muted mono text-xs">{activeCard.id}</p>
                <p className="ui-text-muted mt-2 text-sm">
                  {t("card.frameCounter")}: <span className="mono">{activeCard.frameCount} / {activeCard.frameLimit}</span>
                </p>
                <p className="ui-text-muted text-sm">
                  Status: <Badge>{t(`card.status.${activeCard.status}`)}</Badge>
                </p>
                <p className="ui-text-subtle text-xs">{t("card.noReveal")}</p>
                {activeCard.shared ? (
                  <Button className="mt-2" variant="secondary" onClick={() => inviteMutation.mutate()}>
                    {t("card.invite")}
                  </Button>
                ) : null}
              </>
            ) : (
              <p className="ui-text-subtle text-sm">Create or join a card to start.</p>
            )}
          </Panel>

          <Panel className="col-span-2">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">{t("lens.title")}</h2>
            <div className="flex flex-wrap gap-2">
              {LENSES.map((lens) => {
                const owned = ownedLensIds.has(lens.id);
                return (
                  <div key={lens.id} className="flex items-center gap-1">
                    <Button
                      variant={selectedLens === lens.id ? "primary" : "secondary"}
                      onClick={() => setSelectedLens(lens.id)}
                      disabled={!owned}
                    >
                      {translate(locale, lens.labelKey)}
                    </Button>
                    {!owned ? (
                      <Button variant="ghost" onClick={() => buyLensMutation.mutate(lens.id)}>
                        {t("lens.locked")}
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel className="col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => captureMutation.mutate()} disabled={!activeCard || activeCard.status !== "active"}>
                {t("card.capture")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => developMutation.mutate()}
                disabled={!activeCard || activeCard.status !== "developable"}
              >
                {t("card.develop")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => revealMutation.mutate()}
                disabled={!activeCard || activeCard.status !== "developed"}
              >
                Reveal Frames
              </Button>
            </div>
          </Panel>

          {revealedFrames.length > 0 ? (
            <Panel className="col-span-2">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.08em]">Revealed</h2>
              <div className="grid max-h-40 grid-cols-4 gap-2 overflow-auto">
                {revealedFrames.map((frame) => (
                  <article key={frame.id} className="ui-card rounded p-1">
                    {/* Using data URIs/object URIs from local capture; next/image is not suitable for this dynamic source set. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={frame.derivativeUri ?? frame.masterUri} alt={`Frame ${frame.frameIndex}`} className="h-16 w-full rounded object-cover" />
                    <p className="ui-text-muted mono mt-1 text-[0.65rem]">#{frame.frameIndex}</p>
                  </article>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>
      </section>
    </main>
  );
}
