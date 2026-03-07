import { describe, expect, it } from "vitest";
import { InMemoryLatentStore } from "@/lib/server/store";

describe("invite and join flow", () => {
  it("enforces max six participants", async () => {
    const store = new InMemoryLatentStore();
    const ownerId = "dev_owner";
    const card = await store.createCard({ userId: ownerId, shared: true });
    const invite = await store.createInvite(card.id, ownerId);

    await Promise.all(
      Array.from({ length: 5 }).map((_, idx) => store.joinCard(invite.code, `dev_user_${idx}`))
    );

    await expect(store.joinCard(invite.code, "dev_user_overflow")).rejects.toThrow("Shared card capacity");
  });
});
