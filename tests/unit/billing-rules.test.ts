import { describe, expect, it } from "vitest";
import { InMemoryLatentStore } from "@/lib/server/store";

describe("billing rules", () => {
  it("deducts creator inventory on first frame", async () => {
    const store = new InMemoryLatentStore();
    const ownerId = "dev_owner";
    const card = await store.createCard({ userId: ownerId, shared: false });

    const before = await store.getInventory(ownerId);
    expect(before.inventory.cardsRemaining).toBe(3);

    await store.captureFrame({
      cardId: card.id,
      userId: ownerId,
      lensId: "plain",
      masterUri: "master://1",
      derivativeUri: "derivative://1"
    });

    const after = await store.getInventory(ownerId);
    expect(after.inventory.cardsRemaining).toBe(2);
  });

  it("charges creator even when contributor captures first frame", async () => {
    const store = new InMemoryLatentStore();
    const ownerId = "dev_owner";
    const contributorId = "dev_contributor";

    const card = await store.createCard({ userId: ownerId, shared: true });
    const invite = await store.createInvite(card.id, ownerId);
    await store.joinCard(invite.code, contributorId);

    await store.captureFrame({
      cardId: card.id,
      userId: contributorId,
      lensId: "plain",
      masterUri: "master://1",
      derivativeUri: "derivative://1"
    });

    const ownerInventory = await store.getInventory(ownerId);
    const contributorInventory = await store.getInventory(contributorId);

    expect(ownerInventory.inventory.cardsRemaining).toBe(2);
    expect(contributorInventory.inventory.cardsRemaining).toBe(3);
  });
});
