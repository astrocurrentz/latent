"use client";

import { useEffect } from "react";
import { triggerButtonPressHaptic, triggerShutterReleaseHaptic } from "@/lib/native/haptics";

export function ShutterInteraction() {
  useEffect(() => {
    const shutterButton = document.querySelector<SVGGElement>("#latent-shutter-button");
    const pressDarken = document.querySelector<SVGCircleElement>("#latent-shutter-press-darken");
    if (!shutterButton) {
      return;
    }

    let isPressed = false;

    const setPressed = (pressed: boolean) => {
      shutterButton.classList.toggle("is-pressed", pressed);
      pressDarken?.setAttribute("fill-opacity", "0");
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

    const endPress = (emitReleaseHaptic: boolean) => {
      if (!isPressed) {
        return;
      }
      isPressed = false;
      setPressed(false);
      if (emitReleaseHaptic) {
        window.setTimeout(() => {
          triggerShutterReleaseHaptic();
        }, 0);
      }
    };

    const handlePointerDown = () => {
      startPress();
    };

    const handlePointerUp = () => {
      endPress(true);
    };

    const handlePointerCancelOrLeave = () => {
      endPress(false);
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
        endPress(true);
      }
    };

    const handleBlur = () => {
      isPressed = false;
      setPressed(false);
    };

    pressDarken?.style.setProperty("transition", "fill-opacity 140ms cubic-bezier(0.18, 0.85, 0.28, 1)");

    shutterButton.addEventListener("pointerdown", handlePointerDown);
    shutterButton.addEventListener("pointerleave", handlePointerCancelOrLeave);
    shutterButton.addEventListener("pointercancel", handlePointerCancelOrLeave);
    shutterButton.addEventListener("touchstart", handleTouchStart, { passive: true });
    shutterButton.addEventListener("touchend", handlePointerUp, { passive: true });
    shutterButton.addEventListener("touchcancel", handlePointerCancelOrLeave, { passive: true });
    shutterButton.addEventListener("keydown", handleKeyDown);
    shutterButton.addEventListener("keyup", handleKeyUp);
    shutterButton.addEventListener("blur", handleBlur);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("touchend", handlePointerUp, { passive: true });
    window.addEventListener("touchcancel", handlePointerCancelOrLeave, { passive: true });

    return () => {
      shutterButton.removeEventListener("pointerdown", handlePointerDown);
      shutterButton.removeEventListener("pointerleave", handlePointerCancelOrLeave);
      shutterButton.removeEventListener("pointercancel", handlePointerCancelOrLeave);
      shutterButton.removeEventListener("touchstart", handleTouchStart);
      shutterButton.removeEventListener("touchend", handlePointerUp);
      shutterButton.removeEventListener("touchcancel", handlePointerCancelOrLeave);
      shutterButton.removeEventListener("keydown", handleKeyDown);
      shutterButton.removeEventListener("keyup", handleKeyUp);
      shutterButton.removeEventListener("blur", handleBlur);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
      window.removeEventListener("touchcancel", handlePointerCancelOrLeave);
      isPressed = false;
      setPressed(false);
    };
  }, []);

  return null;
}
