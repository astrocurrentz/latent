import { describe, expect, it } from "vitest";
import { InMemoryLatentStore } from "@/lib/server/store";

describe("concurrent frame capture", () => {
  it("serializes writes and emits unique frame indexes", async () => {
    const store = new InMemoryLatentStore();
    const userId = "dev_owner";
    const card = await store.createCard({ userId, shared: false });

    const captures = await Promise.all(
      Array.from({ length: 10 }).map((_, i) =>
        store.captureFrame({
          cardId: card.id,
          userId,
          lensId: "plain",
          masterUri: `master://${i + 1}`,
          derivativeUri: `derivative://${i + 1}`
        })
      )
    );

    const indexes = captures.map((result) => result.frame.frameIndex).sort((a, b) => a - b);

    expect(indexes).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(captures[captures.length - 1]?.card.frameCount).toBe(10);
  });
});
