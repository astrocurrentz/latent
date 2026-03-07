import { DEFAULT_FRAME_LIMIT } from "@/data/constants";
import { FREE_LENS, type LensId } from "@/data/lenses";
import type { CardStatus } from "@/lib/domain/models";

export function getCardStatus(frameCount: number, frameLimit = DEFAULT_FRAME_LIMIT): CardStatus {
  if (frameCount >= frameLimit) {
    return "developable";
  }

  return "active";
}

export function canDevelop(status: CardStatus, frameCount: number, frameLimit = DEFAULT_FRAME_LIMIT): boolean {
  return status === "developable" && frameCount === frameLimit;
}

export function isLensAllowed(lensId: LensId, ownedLensIds: Set<string>): boolean {
  if (lensId === FREE_LENS) {
    return true;
  }

  return ownedLensIds.has(lensId);
}

export function nextFrameIndex(frameCount: number, frameLimit = DEFAULT_FRAME_LIMIT): number {
  if (frameCount >= frameLimit) {
    throw new Error("Card is full");
  }

  return frameCount + 1;
}
