import { describe, expect, it } from "vitest";
import { InMemoryLatentStore } from "@/lib/server/store";
import { LENS_SKUS } from "@/data/constants";

describe("lens gating", () => {
  it("blocks premium lens capture without entitlement", async () => {
    const store = new InMemoryLatentStore();
    const ownerId = "dev_owner";
    const card = await store.createCard({ userId: ownerId, shared: false });

    await expect(
      store.captureFrame({
        cardId: card.id,
        userId: ownerId,
        lensId: "ascii",
        masterUri: "master://1",
        derivativeUri: "derivative://1"
      })
    ).rejects.toThrow("Lens entitlement required");
  });

  it("allows premium lens after purchase", async () => {
    const store = new InMemoryLatentStore();
    const ownerId = "dev_owner";
    const card = await store.createCard({ userId: ownerId, shared: false });

    await store.applyPurchase({
      userId: ownerId,
      productId: LENS_SKUS.ascii,
      transactionId: "tx_ascii_1"
    });

    const capture = await store.captureFrame({
      cardId: card.id,
      userId: ownerId,
      lensId: "ascii",
      masterUri: "master://1",
      derivativeUri: "derivative://1"
    });

    expect(capture.frame.frameIndex).toBe(1);
    expect(capture.card.frameCount).toBe(1);
  });
});
