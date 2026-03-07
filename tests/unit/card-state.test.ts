import { describe, expect, it } from "vitest";
import { canDevelop, getCardStatus, nextFrameIndex } from "@/lib/domain/cards";

describe("card state transitions", () => {
  it("moves active -> developable at frame 24", () => {
    expect(getCardStatus(0, 24)).toBe("active");
    expect(getCardStatus(23, 24)).toBe("active");
    expect(getCardStatus(24, 24)).toBe("developable");
  });

  it("allows develop only when exactly at frame limit", () => {
    expect(canDevelop("active", 23, 24)).toBe(false);
    expect(canDevelop("developable", 24, 24)).toBe(true);
    expect(canDevelop("developable", 23, 24)).toBe(false);
  });

  it("throws when requesting frame index past limit", () => {
    expect(nextFrameIndex(23, 24)).toBe(24);
    expect(() => nextFrameIndex(24, 24)).toThrow("Card is full");
  });
});
