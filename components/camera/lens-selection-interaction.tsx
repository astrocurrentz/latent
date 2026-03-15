"use client";

import { useEffect, type MutableRefObject } from "react";
import type { LensId } from "@/data/lenses";
import { triggerButtonPressHaptic } from "@/lib/native/haptics";

type SelectableLensId = Exclude<LensId, "plain">;

interface LensSelectionInteractionProps {
  selectedLensRef: MutableRefObject<SelectableLensId | null>;
}

type LensButtonConfig = {
  lensId: SelectableLensId;
  buttonSelector: string;
  hitTargetSelector: string;
  capSelector: string;
  pressDarkenSelector: string;
  textCoreSelector: string;
  textGlowSelector: string;
  textOverlaySelector: string;
};

const LENS_BUTTON_CONFIGS: LensButtonConfig[] = [
  {
    lensId: "ascii",
    buttonSelector: "#latent-lens-ascii-button",
    hitTargetSelector: "#latent-lens-ascii-hit",
    capSelector: "#latent-lens-ascii-cap",
    pressDarkenSelector: "#latent-lens-ascii-press-darken",
    textCoreSelector: "#latent-lens-ascii-text-core",
    textGlowSelector: "#latent-lens-ascii-text-glow",
    textOverlaySelector: "#latent-lens-ascii-text-overlay"
  },
  {
    lensId: "glitched",
    buttonSelector: "#latent-lens-glitched-button",
    hitTargetSelector: "#latent-lens-glitched-hit",
    capSelector: "#latent-lens-glitched-cap",
    pressDarkenSelector: "#latent-lens-glitched-press-darken",
    textCoreSelector: "#latent-lens-glitched-text-core",
    textGlowSelector: "#latent-lens-glitched-text-glow",
    textOverlaySelector: "#latent-lens-glitched-text-overlay"
  },
  {
    lensId: "halftone",
    buttonSelector: "#latent-lens-halftone-button",
    hitTargetSelector: "#latent-lens-halftone-hit",
    capSelector: "#latent-lens-halftone-cap",
    pressDarkenSelector: "#latent-lens-halftone-press-darken",
    textCoreSelector: "#latent-lens-halftone-text-core",
    textGlowSelector: "#latent-lens-halftone-text-glow",
    textOverlaySelector: "#latent-lens-halftone-text-overlay"
  },
  {
    lensId: "night",
    buttonSelector: "#latent-lens-night-button",
    hitTargetSelector: "#latent-lens-night-hit",
    capSelector: "#latent-lens-night-cap",
    pressDarkenSelector: "#latent-lens-night-press-darken",
    textCoreSelector: "#latent-lens-night-text-core",
    textGlowSelector: "#latent-lens-night-text-glow",
    textOverlaySelector: "#latent-lens-night-text-overlay"
  },
  {
    lensId: "thermal",
    buttonSelector: "#latent-lens-thermal-button",
    hitTargetSelector: "#latent-lens-thermal-hit",
    capSelector: "#latent-lens-thermal-cap",
    pressDarkenSelector: "#latent-lens-thermal-press-darken",
    textCoreSelector: "#latent-lens-thermal-text-core",
    textGlowSelector: "#latent-lens-thermal-text-glow",
    textOverlaySelector: "#latent-lens-thermal-text-overlay"
  },
  {
    lensId: "x-ray",
    buttonSelector: "#latent-lens-xray-button",
    hitTargetSelector: "#latent-lens-xray-hit",
    capSelector: "#latent-lens-xray-cap",
    pressDarkenSelector: "#latent-lens-xray-press-darken",
    textCoreSelector: "#latent-lens-xray-text-core",
    textGlowSelector: "#latent-lens-xray-text-glow",
    textOverlaySelector: "#latent-lens-xray-text-overlay"
  }
];

type LensButtonDom = {
  lensId: SelectableLensId;
  button: SVGGElement;
  hitTarget: SVGElement | null;
  cap: SVGElement | null;
  pressDarken: SVGElement | null;
  textCore: SVGElement | null;
  textGlow: SVGElement | null;
  textOverlay: SVGElement | null;
};

function resolveLensButtons(): LensButtonDom[] {
  return LENS_BUTTON_CONFIGS.flatMap((config) => {
    const button = document.querySelector<SVGGElement>(config.buttonSelector);
    if (!button) {
      return [];
    }

    return [
      {
        lensId: config.lensId,
        button,
        hitTarget: document.querySelector<SVGElement>(config.hitTargetSelector),
        cap: document.querySelector<SVGElement>(config.capSelector),
        pressDarken: document.querySelector<SVGElement>(config.pressDarkenSelector),
        textCore: document.querySelector<SVGElement>(config.textCoreSelector),
        textGlow: document.querySelector<SVGElement>(config.textGlowSelector),
        textOverlay: document.querySelector<SVGElement>(config.textOverlaySelector)
      }
    ];
  });
}

function syncLensSelection(lensButtons: LensButtonDom[], selectedLens: SelectableLensId | null) {
  for (const lensButton of lensButtons) {
    const isSelected = selectedLens === lensButton.lensId;
    lensButton.button.classList.toggle("is-selected", isSelected);
    lensButton.button.setAttribute("aria-pressed", isSelected ? "true" : "false");

    lensButton.textCore?.setAttribute("fill", isSelected ? "#DD8943" : "#999999");
    lensButton.textGlow?.setAttribute("opacity", isSelected ? "1" : "0");
    lensButton.textOverlay?.setAttribute("fill-opacity", isSelected ? "0.27" : "0.1");
  }
}

function prepareLensButton(button: SVGGElement, hitTarget: SVGElement | null) {
  button.style.pointerEvents = "all";
  button.style.cursor = "pointer";
  button.style.touchAction = "manipulation";
  button.style.setProperty("-webkit-tap-highlight-color", "transparent");
  hitTarget?.style.setProperty("pointer-events", "all");
  hitTarget?.style.setProperty("cursor", "pointer");
}

export function LensSelectionInteraction({ selectedLensRef }: LensSelectionInteractionProps) {
  useEffect(() => {
    const lensButtons = resolveLensButtons();
    if (lensButtons.length === 0) {
      return;
    }

    const cleanups: Array<() => void> = [];

    // Force plain default on startup and normalize away any baked template highlight.
    selectedLensRef.current = null;
    syncLensSelection(lensButtons, null);

    for (const lensButton of lensButtons) {
      prepareLensButton(lensButton.button, lensButton.hitTarget);

      let isPressed = false;
      let suppressNextClick = false;

      const setPressed = (pressed: boolean) => {
        lensButton.button.classList.toggle("is-pressed", pressed);
        lensButton.pressDarken?.setAttribute("fill-opacity", pressed ? "0.2" : "0");
      };

      const startPress = () => {
        if (isPressed) {
          return;
        }
        isPressed = true;
        setPressed(true);
        window.setTimeout(() => {
          triggerButtonPressHaptic();
        }, 0);
      };

      const endPress = () => {
        if (!isPressed) {
          return;
        }
        isPressed = false;
        setPressed(false);
      };

      const toggleSelection = () => {
        const nextSelection = selectedLensRef.current === lensButton.lensId ? null : lensButton.lensId;
        selectedLensRef.current = nextSelection;
        syncLensSelection(lensButtons, nextSelection);
      };

      const handlePointerDown = () => {
        startPress();
      };

      const handlePointerUp = () => {
        endPress();
      };

      const handleTouchStart = () => {
        startPress();
      };

      const handleClick = () => {
        if (suppressNextClick) {
          suppressNextClick = false;
          return;
        }
        toggleSelection();
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          startPress();
        }
      };

      const handleKeyUp = (event: KeyboardEvent) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          endPress();
          toggleSelection();
          suppressNextClick = true;
        }
      };

      const handleBlur = () => {
        isPressed = false;
        setPressed(false);
      };

      lensButton.button.addEventListener("pointerdown", handlePointerDown);
      lensButton.button.addEventListener("pointerleave", handlePointerUp);
      lensButton.button.addEventListener("pointercancel", handlePointerUp);
      lensButton.button.addEventListener("touchstart", handleTouchStart, { passive: true });
      lensButton.button.addEventListener("touchend", handlePointerUp, { passive: true });
      lensButton.button.addEventListener("touchcancel", handlePointerUp, { passive: true });
      lensButton.button.addEventListener("click", handleClick);
      lensButton.button.addEventListener("keydown", handleKeyDown);
      lensButton.button.addEventListener("keyup", handleKeyUp);
      lensButton.button.addEventListener("blur", handleBlur);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("touchend", handlePointerUp, { passive: true });
      window.addEventListener("touchcancel", handlePointerUp, { passive: true });

      cleanups.push(() => {
        lensButton.button.removeEventListener("pointerdown", handlePointerDown);
        lensButton.button.removeEventListener("pointerleave", handlePointerUp);
        lensButton.button.removeEventListener("pointercancel", handlePointerUp);
        lensButton.button.removeEventListener("touchstart", handleTouchStart);
        lensButton.button.removeEventListener("touchend", handlePointerUp);
        lensButton.button.removeEventListener("touchcancel", handlePointerUp);
        lensButton.button.removeEventListener("click", handleClick);
        lensButton.button.removeEventListener("keydown", handleKeyDown);
        lensButton.button.removeEventListener("keyup", handleKeyUp);
        lensButton.button.removeEventListener("blur", handleBlur);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("touchend", handlePointerUp);
        window.removeEventListener("touchcancel", handlePointerUp);
        isPressed = false;
        setPressed(false);
      });
    }

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [selectedLensRef]);

  return null;
}
