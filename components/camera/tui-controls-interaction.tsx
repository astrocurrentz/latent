"use client";

import { useEffect } from "react";
import { triggerButtonPressHaptic } from "@/lib/native/haptics";

function bindPressOnly(button: SVGGElement, setPressed: (pressed: boolean) => void) {
  let isPressed = false;

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

  const handlePointerDown = () => {
    startPress();
  };

  const handlePointerUp = () => {
    endPress();
  };

  const handleTouchStart = () => {
    startPress();
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
    }
  };

  const handleBlur = () => {
    isPressed = false;
    setPressed(false);
  };

  button.addEventListener("pointerdown", handlePointerDown);
  button.addEventListener("pointerleave", handlePointerUp);
  button.addEventListener("pointercancel", handlePointerUp);
  button.addEventListener("touchstart", handleTouchStart, { passive: true });
  button.addEventListener("touchend", handlePointerUp, { passive: true });
  button.addEventListener("touchcancel", handlePointerUp, { passive: true });
  button.addEventListener("keydown", handleKeyDown);
  button.addEventListener("keyup", handleKeyUp);
  button.addEventListener("blur", handleBlur);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("touchend", handlePointerUp, { passive: true });
  window.addEventListener("touchcancel", handlePointerUp, { passive: true });

  return () => {
    button.removeEventListener("pointerdown", handlePointerDown);
    button.removeEventListener("pointerleave", handlePointerUp);
    button.removeEventListener("pointercancel", handlePointerUp);
    button.removeEventListener("touchstart", handleTouchStart);
    button.removeEventListener("touchend", handlePointerUp);
    button.removeEventListener("touchcancel", handlePointerUp);
    button.removeEventListener("keydown", handleKeyDown);
    button.removeEventListener("keyup", handleKeyUp);
    button.removeEventListener("blur", handleBlur);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("touchend", handlePointerUp);
    window.removeEventListener("touchcancel", handlePointerUp);
    isPressed = false;
    setPressed(false);
  };
}

function prepareSvgButton(button: SVGGElement, hitTarget: SVGElement | null) {
  button.style.pointerEvents = "all";
  button.style.cursor = "pointer";
  button.style.touchAction = "manipulation";
  button.style.setProperty("-webkit-tap-highlight-color", "transparent");
  hitTarget?.style.setProperty("pointer-events", "all");
  hitTarget?.style.setProperty("cursor", "pointer");
}

export function TuiControlsInteraction() {
  useEffect(() => {
    const centerButton = document.querySelector<SVGGElement>("#latent-tui-button");
    const centerHit = document.querySelector<SVGCircleElement>("#latent-tui-hit");
    const centerBase = document.querySelector<SVGCircleElement>("#latent-tui-base-disc");
    const centerSurface = document.querySelector<SVGCircleElement>("#latent-tui-surface-disc");
    const centerDarken = document.querySelector<SVGCircleElement>("#latent-tui-press-darken");

    const upButton = document.querySelector<SVGGElement>("#latent-tui-up-button");
    const upHit = document.querySelector<SVGRectElement>("#latent-tui-up-hit");
    const upBase = document.querySelector<SVGPathElement>("#latent-tui-up-base");
    const upSurface = document.querySelector<SVGPathElement>("#latent-tui-up-surface");
    const upDarken = document.querySelector<SVGPathElement>("#latent-tui-up-press-darken");

    const downButton = document.querySelector<SVGGElement>("#latent-tui-down-button");
    const downHit = document.querySelector<SVGRectElement>("#latent-tui-down-hit");
    const downBase = document.querySelector<SVGPathElement>("#latent-tui-down-base");
    const downSurface = document.querySelector<SVGPathElement>("#latent-tui-down-surface");
    const downDarken = document.querySelector<SVGPathElement>("#latent-tui-down-press-darken");

    const cleanups: Array<() => void> = [];
    const releaseTiming = "130ms cubic-bezier(0.18, 0.85, 0.28, 1)";

    if (centerButton) {
      prepareSvgButton(centerButton, centerHit);

      cleanups.push(
        bindPressOnly(centerButton, (pressed) => {
          centerBase?.style.setProperty("transition", pressed ? "r 0ms linear" : `r ${releaseTiming}`);
          centerSurface?.style.setProperty("transition", pressed ? "r 0ms linear" : `r ${releaseTiming}`);
          centerDarken?.style.setProperty(
            "transition",
            pressed ? "fill-opacity 0ms linear, r 0ms linear" : `fill-opacity ${releaseTiming}, r ${releaseTiming}`
          );
          centerButton.classList.toggle("is-pressed", pressed);
          centerBase?.setAttribute("r", pressed ? "11.35" : "12");
          centerSurface?.setAttribute("r", pressed ? "10.3" : "11");
          centerDarken?.setAttribute("r", pressed ? "10.3" : "11");
          centerDarken?.setAttribute("fill-opacity", pressed ? "0.2" : "0");
        })
      );
    }

    const prepareTriangleInner = (base: SVGPathElement | null, surface: SVGPathElement | null, darken: SVGPathElement | null) => {
      base?.style.setProperty("transform-box", "fill-box");
      base?.style.setProperty("transform-origin", "center center");

      surface?.style.setProperty("transform-box", "fill-box");
      surface?.style.setProperty("transform-origin", "center center");

      darken?.style.setProperty("transform-box", "fill-box");
      darken?.style.setProperty("transform-origin", "center center");
    };

    if (upButton) {
      prepareSvgButton(upButton, upHit);
      prepareTriangleInner(upBase, upSurface, upDarken);

      cleanups.push(
        bindPressOnly(upButton, (pressed) => {
          upBase?.style.setProperty("transition", pressed ? "transform 0ms linear" : `transform ${releaseTiming}`);
          upSurface?.style.setProperty("transition", pressed ? "transform 0ms linear" : `transform ${releaseTiming}`);
          upDarken?.style.setProperty(
            "transition",
            pressed ? "transform 0ms linear, fill-opacity 0ms linear" : `transform ${releaseTiming}, fill-opacity ${releaseTiming}`
          );
          upButton.classList.toggle("is-pressed", pressed);
          upBase?.style.setProperty("transform", pressed ? "translateY(1.2px)" : "translateY(0px)");
          upSurface?.style.setProperty("transform", pressed ? "translateY(1.2px)" : "translateY(0px)");
          upDarken?.style.setProperty("transform", pressed ? "translateY(1.2px)" : "translateY(0px)");
          upDarken?.setAttribute("fill-opacity", pressed ? "0.2" : "0");
        })
      );
    }

    if (downButton) {
      prepareSvgButton(downButton, downHit);
      prepareTriangleInner(downBase, downSurface, downDarken);

      cleanups.push(
        bindPressOnly(downButton, (pressed) => {
          downBase?.style.setProperty("transition", pressed ? "transform 0ms linear" : `transform ${releaseTiming}`);
          downSurface?.style.setProperty("transition", pressed ? "transform 0ms linear" : `transform ${releaseTiming}`);
          downDarken?.style.setProperty(
            "transition",
            pressed ? "transform 0ms linear, fill-opacity 0ms linear" : `transform ${releaseTiming}, fill-opacity ${releaseTiming}`
          );
          downButton.classList.toggle("is-pressed", pressed);
          downBase?.style.setProperty("transform", pressed ? "translateY(-1.2px)" : "translateY(0px)");
          downSurface?.style.setProperty("transform", pressed ? "translateY(-1.2px)" : "translateY(0px)");
          downDarken?.style.setProperty("transform", pressed ? "translateY(-1.2px)" : "translateY(0px)");
          downDarken?.setAttribute("fill-opacity", pressed ? "0.2" : "0");
        })
      );
    }

    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, []);

  return null;
}
