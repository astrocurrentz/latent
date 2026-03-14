"use client";

import { useEffect } from "react";
import { triggerButtonPressHaptic } from "@/lib/native/haptics";

export function SharedButtonInteraction() {
  useEffect(() => {
    const sharedButton = document.querySelector<SVGGElement>("#latent-shared-button");
    const hitTarget = document.querySelector<SVGCircleElement>("#latent-shared-hit");
    const baseDisc = document.querySelector<SVGCircleElement>("#latent-shared-base-disc");
    const surfaceDisc = document.querySelector<SVGCircleElement>("#latent-shared-surface-disc");
    const pressDarken = document.querySelector<SVGCircleElement>("#latent-shared-press-darken");
    const statusGlow = document.querySelector<SVGCircleElement>("#latent-shared-status-glow");
    const statusCore = document.querySelector<SVGCircleElement>("#latent-shared-status-core");
    const statusOverlay = document.querySelector<SVGCircleElement>("#latent-shared-status-overlay");
    const statusRim = document.querySelector<SVGCircleElement>("#latent-shared-status-rim");

    if (!sharedButton) {
      return;
    }

    let isPressed = false;
    let isShared = sharedButton.classList.contains("is-shared");
    let suppressNextClick = false;
    const releaseTiming = "130ms cubic-bezier(0.18, 0.85, 0.28, 1)";

    const syncTransitionTiming = (pressed: boolean) => {
      baseDisc?.style.setProperty("transition", pressed ? "r 0ms linear" : `r ${releaseTiming}`);
      surfaceDisc?.style.setProperty("transition", pressed ? "r 0ms linear" : `r ${releaseTiming}`);
      pressDarken?.style.setProperty("transition", pressed ? "fill-opacity 0ms linear" : `fill-opacity ${releaseTiming}`);
      statusGlow?.style.setProperty(
        "transition",
        pressed ? "r 0ms linear, opacity 0ms linear" : `r ${releaseTiming}, opacity ${releaseTiming}`
      );
      statusCore?.style.setProperty(
        "transition",
        pressed ? "r 0ms linear, fill 0ms linear" : `r ${releaseTiming}, fill ${releaseTiming}`
      );
      statusOverlay?.style.setProperty(
        "transition",
        pressed ? "r 0ms linear, opacity 0ms linear" : `r ${releaseTiming}, opacity ${releaseTiming}`
      );
      statusRim?.style.setProperty("transition", pressed ? "r 0ms linear" : `r ${releaseTiming}`);
    };

    const setPressed = (pressed: boolean) => {
      syncTransitionTiming(pressed);
      sharedButton.classList.toggle("is-pressed", pressed);

      baseDisc?.setAttribute("r", pressed ? "19.45" : "20.1923");
      surfaceDisc?.setAttribute("r", pressed ? "17.65" : "18.3566");
      pressDarken?.setAttribute("fill-opacity", pressed ? "0.2" : "0");
      statusGlow?.setAttribute("r", pressed ? "2.2" : "2.5");
      statusCore?.setAttribute("r", pressed ? "2.2" : "2.5");
      statusOverlay?.setAttribute("r", pressed ? "2.15" : "2.45");
      statusRim?.setAttribute("r", pressed ? "2.15" : "2.45");
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

    const syncShared = () => {
      sharedButton.classList.toggle("is-shared", isShared);
      sharedButton.setAttribute("aria-pressed", isShared ? "true" : "false");
      statusGlow?.setAttribute("opacity", isShared ? "0.85" : "0");
      statusCore?.setAttribute("fill", isShared ? "#DD8943" : "#999999");
      statusOverlay?.setAttribute("opacity", isShared ? "0" : "0.27");
    };

    const toggleShared = () => {
      isShared = !isShared;
      syncShared();
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
      toggleShared();
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
        toggleShared();
        suppressNextClick = true;
      }
    };

    const handleBlur = () => {
      isPressed = false;
      setPressed(false);
    };

    // Ensure the shared button is pointer-hit-testable even when parent SVG rules disable pointer events.
    sharedButton.style.pointerEvents = "all";
    sharedButton.style.cursor = "pointer";
    sharedButton.style.touchAction = "manipulation";
    sharedButton.style.setProperty("-webkit-tap-highlight-color", "transparent");
    hitTarget?.style.setProperty("pointer-events", "all");
    hitTarget?.style.setProperty("cursor", "pointer");

    syncTransitionTiming(false);

    syncShared();

    sharedButton.addEventListener("pointerdown", handlePointerDown);
    sharedButton.addEventListener("pointerleave", handlePointerUp);
    sharedButton.addEventListener("pointercancel", handlePointerUp);
    sharedButton.addEventListener("touchstart", handleTouchStart, { passive: true });
    sharedButton.addEventListener("touchend", handlePointerUp, { passive: true });
    sharedButton.addEventListener("touchcancel", handlePointerUp, { passive: true });
    sharedButton.addEventListener("click", handleClick);
    sharedButton.addEventListener("keydown", handleKeyDown);
    sharedButton.addEventListener("keyup", handleKeyUp);
    sharedButton.addEventListener("blur", handleBlur);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("touchend", handlePointerUp, { passive: true });
    window.addEventListener("touchcancel", handlePointerUp, { passive: true });

    return () => {
      sharedButton.removeEventListener("pointerdown", handlePointerDown);
      sharedButton.removeEventListener("pointerleave", handlePointerUp);
      sharedButton.removeEventListener("pointercancel", handlePointerUp);
      sharedButton.removeEventListener("touchstart", handleTouchStart);
      sharedButton.removeEventListener("touchend", handlePointerUp);
      sharedButton.removeEventListener("touchcancel", handlePointerUp);
      sharedButton.removeEventListener("click", handleClick);
      sharedButton.removeEventListener("keydown", handleKeyDown);
      sharedButton.removeEventListener("keyup", handleKeyUp);
      sharedButton.removeEventListener("blur", handleBlur);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
      window.removeEventListener("touchcancel", handlePointerUp);
      isPressed = false;
      setPressed(false);
    };
  }, []);

  return null;
}
