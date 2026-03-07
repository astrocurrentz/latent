import { describe, expect, it } from "vitest";
import { InMemoryLatentStore } from "@/lib/server/store";

describe("develop and reveal flow", () => {
  it("reveals only after explicit develop at frame limit", async () => {
    const store = new InMemoryLatentStore();
    const userId = "dev_owner";
    const card = await store.createCard({ userId, shared: false });

    for (let i = 0; i < 24; i += 1) {
      await store.captureFrame({
        cardId: card.id,
        userId,
        lensId: "plain",
        masterUri: `master://${i}`,
        derivativeUri: `derivative://${i}`
      });
    }

    const beforeDevelop = await store.getCard(card.id, userId);
    expect(beforeDevelop.status).toBe("developable");

    await expect(store.listCardFrames(card.id, userId)).rejects.toThrow("still latent");

    await store.developCard(card.id, userId);
    const revealed = await store.listCardFrames(card.id, userId);

    expect(revealed).toHaveLength(24);
    expect(revealed[0]?.frameIndex).toBe(1);
    expect(revealed[23]?.frameIndex).toBe(24);
  });
});
