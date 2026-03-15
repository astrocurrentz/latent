"use client";

import { useEffect } from "react";
import { triggerButtonPressHaptic, triggerShutterReleaseHaptic, triggerSliderLockHaptic } from "@/lib/native/haptics";

interface ShutterInteractionProps {
  onCommit?: () => void | Promise<void>;
}

const SHUTTER_ARM_THRESHOLD = 0.95;
const SLIDER_LEFT_CENTER_X = 405.5;
const SLIDER_MIDDLE_CENTER_X = 500.5;
const SLIDER_RIGHT_CENTER_X = 595.5;

function clamp01(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function sliderValueToCenterX(value: number): number {
  return SLIDER_LEFT_CENTER_X + (SLIDER_RIGHT_CENTER_X - SLIDER_LEFT_CENTER_X) * clamp01(value);
}

function sliderCenterXToValue(centerX: number): number {
  return clamp01((centerX - SLIDER_LEFT_CENTER_X) / (SLIDER_RIGHT_CENTER_X - SLIDER_LEFT_CENTER_X));
}

function clientToSvgX(svg: SVGSVGElement, clientX: number, clientY: number): number | null {
  const matrix = svg.getScreenCTM();
  if (!matrix) {
    return null;
  }
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  return point.matrixTransform(matrix.inverse()).x;
}

export function ShutterInteraction({ onCommit }: ShutterInteractionProps) {
  useEffect(() => {
    const shutterButton = document.querySelector<SVGGElement>("#latent-shutter-button");
    const pressDarken = document.querySelector<SVGCircleElement>("#latent-shutter-press-darken");
    const sliderControl = document.querySelector<SVGGElement>("#latent-shutter-slider");
    const sliderHit = document.querySelector<SVGRectElement>("#latent-shutter-slider-hit");
    const sliderThumb = document.querySelector<SVGGElement>("#latent-shutter-slider-thumb");
    const toggleButton = document.querySelector<SVGGElement>("#latent-double-toggle-button");
    const toggleHit = document.querySelector<SVGRectElement>("#latent-double-toggle-hit");

    if (!shutterButton || !sliderControl || !sliderThumb || !toggleButton) {
      return;
    }

    const svgRoot = shutterButton.ownerSVGElement ?? sliderControl.ownerSVGElement ?? toggleButton.ownerSVGElement;
    if (!svgRoot) {
      return;
    }

    let sliderValue = 0;
    let doubleEnabled = false;
    let pendingSecondShot = false;
    let sliderLocked = false;

    let isSliderDragging = false;
    let activeSliderPointerId: number | null = null;

    let isTogglePressed = false;
    let activeTogglePointerId: number | null = null;
    let isShutterPressed = false;
    let activeShutterPointerId: number | null = null;

    const prepareInteractiveTarget = (node: SVGElement | null) => {
      if (!node) {
        return;
      }
      node.style.pointerEvents = "all";
      node.style.cursor = "pointer";
      node.style.touchAction = "none";
      node.style.setProperty("-webkit-tap-highlight-color", "transparent");
    };

    prepareInteractiveTarget(shutterButton);
    prepareInteractiveTarget(sliderControl);
    prepareInteractiveTarget(sliderHit);
    prepareInteractiveTarget(sliderThumb);
    prepareInteractiveTarget(toggleButton);
    prepareInteractiveTarget(toggleHit);

    const isSliderArmed = () => sliderValue >= SHUTTER_ARM_THRESHOLD;
    const isSliderAtFarRight = () => sliderValue >= 0.999;
    const canTriggerShutter = () => pendingSecondShot || isSliderArmed();

    const syncSliderVisual = () => {
      const centerX = sliderValueToCenterX(sliderValue);
      const offsetX = centerX - SLIDER_MIDDLE_CENTER_X;
      sliderThumb.style.transform = `translate(${offsetX}px, 0)`;
      sliderControl.classList.toggle("is-locked", sliderLocked);
      sliderControl.setAttribute("aria-valuenow", String(Math.round(sliderValue * 100)));
    };

    const syncToggleVisual = () => {
      toggleButton.classList.toggle("is-on", doubleEnabled);
      toggleButton.setAttribute("aria-pressed", doubleEnabled ? "true" : "false");
    };

    const syncShutterVisual = () => {
      const enabled = canTriggerShutter();
      shutterButton.classList.toggle("is-disabled", !enabled);
      shutterButton.setAttribute("aria-disabled", enabled ? "false" : "true");
      // Keep disabled state visually pressed and never dimmed.
      shutterButton.style.opacity = "1";
      shutterButton.classList.toggle("is-pressed", isShutterPressed || !enabled);
    };

    const syncAllVisuals = () => {
      syncSliderVisual();
      syncToggleVisual();
      syncShutterVisual();
    };

    const setSliderValue = (nextValue: number, emitThresholdHaptic: boolean) => {
      const wasArmed = isSliderArmed();
      sliderValue = clamp01(nextValue);
      const isNowArmed = isSliderArmed();
      syncSliderVisual();
      syncShutterVisual();

      if (emitThresholdHaptic && wasArmed !== isNowArmed) {
        window.setTimeout(() => {
          triggerButtonPressHaptic();
        }, 0);
      }
    };

    const moveSliderProgrammatically = (nextValue: number) => {
      isSliderDragging = false;
      activeSliderPointerId = null;
      sliderControl.classList.remove("is-dragging");
      setSliderValue(nextValue, false);
    };

    const playRightSnapFeedback = () => {
      triggerSliderLockHaptic();
      window.setTimeout(() => {
        triggerButtonPressHaptic();
      }, 70);
      // Use the same elastic slider transition as left snap-back, mirrored to the right.
      sliderControl.classList.add("is-dragging");
      setSliderValue(0.92, false);
      sliderControl.classList.remove("is-dragging");
      window.setTimeout(() => {
        setSliderValue(1, false);
      }, 0);
    };

    const updateSliderFromPointer = (event: PointerEvent) => {
      const svgX = clientToSvgX(svgRoot, event.clientX, event.clientY);
      if (svgX === null) {
        return;
      }
      setSliderValue(sliderCenterXToValue(svgX), true);
    };

    const toggleDoubleEnabled = () => {
      if (pendingSecondShot) {
        return;
      }
      doubleEnabled = !doubleEnabled;
      syncToggleVisual();
    };

    const commitCapture = () => {
      if (!onCommit) {
        return;
      }
      void Promise.resolve(onCommit()).catch(() => undefined);
    };

    const runShutterCommitFlow = () => {
      commitCapture();

      if (pendingSecondShot) {
        pendingSecondShot = false;
        sliderLocked = false;
        moveSliderProgrammatically(0);
        syncAllVisuals();
        return;
      }

      if (!isSliderArmed()) {
        syncShutterVisual();
        return;
      }

      if (doubleEnabled) {
        pendingSecondShot = true;
        sliderLocked = true;
        doubleEnabled = false;
        syncToggleVisual();
        window.setTimeout(() => {
          triggerButtonPressHaptic();
        }, 0);
        moveSliderProgrammatically(0.5);
        syncAllVisuals();
        return;
      }

      sliderLocked = false;
      doubleEnabled = false;
      syncToggleVisual();
      moveSliderProgrammatically(0);
      syncAllVisuals();
    };

    const setShutterPressed = (pressed: boolean) => {
      const forcePressedByDisabled = shutterButton.classList.contains("is-disabled");
      shutterButton.classList.toggle("is-pressed", pressed || forcePressedByDisabled);
      pressDarken?.setAttribute("fill-opacity", "0");
    };

    const startShutterPress = () => {
      if (isShutterPressed || !canTriggerShutter()) {
        return false;
      }
      isShutterPressed = true;
      setShutterPressed(true);
      window.setTimeout(() => {
        triggerButtonPressHaptic();
      }, 0);
      return true;
    };

    const endShutterPress = (emitReleaseHaptic: boolean) => {
      if (!isShutterPressed) {
        return false;
      }
      isShutterPressed = false;
      setShutterPressed(false);
      if (emitReleaseHaptic) {
        window.setTimeout(() => {
          triggerShutterReleaseHaptic();
        }, 0);
      }
      return true;
    };

    const beginSliderDrag = (event: PointerEvent) => {
      if (sliderLocked || event.button !== 0) {
        return;
      }
      event.preventDefault();
      isSliderDragging = true;
      activeSliderPointerId = event.pointerId;
      sliderControl.classList.add("is-dragging");
      sliderControl.setPointerCapture?.(event.pointerId);
      window.setTimeout(() => {
        triggerButtonPressHaptic();
      }, 0);
      updateSliderFromPointer(event);
    };

    const finishSliderDrag = (pointerId: number) => {
      if (!isSliderDragging || activeSliderPointerId !== pointerId) {
        return;
      }
      isSliderDragging = false;
      activeSliderPointerId = null;
      sliderControl.classList.remove("is-dragging");

      if (!sliderLocked && !pendingSecondShot) {
        if (isSliderAtFarRight()) {
          sliderLocked = true;
          // Lock to the right detent with mirrored elastic settle + haptic.
          playRightSnapFeedback();
        } else {
          sliderLocked = false;
          // Snap back with the existing thumb transition when not fully armed.
          setSliderValue(0, false);
        }
      }
    };

    const beginTogglePress = (event: PointerEvent) => {
      if (pendingSecondShot || event.button !== 0) {
        return;
      }
      event.preventDefault();
      isTogglePressed = true;
      activeTogglePointerId = event.pointerId;
      toggleButton.classList.add("is-pressed");
      window.setTimeout(() => {
        triggerButtonPressHaptic();
      }, 0);
    };

    const endTogglePress = (pointerId: number | null) => {
      if (!isTogglePressed) {
        return;
      }
      if (pointerId !== null && activeTogglePointerId !== pointerId) {
        return;
      }
      isTogglePressed = false;
      activeTogglePointerId = null;
      toggleButton.classList.remove("is-pressed");
    };

    const handleSliderPointerDown = (event: PointerEvent) => {
      beginSliderDrag(event);
    };

    const handleTogglePointerDown = (event: PointerEvent) => {
      beginTogglePress(event);
    };

    const handleToggleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") {
        return;
      }
      if (pendingSecondShot) {
        event.preventDefault();
        return;
      }
      if (isTogglePressed) {
        return;
      }
      event.preventDefault();
      isTogglePressed = true;
      toggleButton.classList.add("is-pressed");
      window.setTimeout(() => {
        triggerButtonPressHaptic();
      }, 0);
    };

    const handleToggleKeyUp = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      if (!isTogglePressed) {
        return;
      }
      isTogglePressed = false;
      toggleButton.classList.remove("is-pressed");
      toggleDoubleEnabled();
    };

    const isToggleReleaseInside = (clientX: number, clientY: number): boolean => {
      const el = document.elementFromPoint(clientX, clientY);
      if (!el) {
        return false;
      }
      return el === toggleButton || toggleButton.contains(el);
    };

    const handleShutterPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      if (!startShutterPress()) {
        return;
      }
      event.preventDefault();
      activeShutterPointerId = event.pointerId;
      shutterButton.setPointerCapture?.(event.pointerId);
    };

    const handleShutterPointerLeave = () => {
      activeShutterPointerId = null;
      endShutterPress(false);
    };

    const handleShutterKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      startShutterPress();
    };

    const handleShutterKeyUp = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "Enter") {
        return;
      }
      event.preventDefault();
      if (endShutterPress(true)) {
        runShutterCommitFlow();
      }
    };

    const handleSliderKeyDown = (event: KeyboardEvent) => {
      if (sliderLocked) {
        return;
      }

      let nextValue = sliderValue;
      const step = 0.05;

      if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        nextValue = sliderValue + step;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        nextValue = sliderValue - step;
      } else if (event.key === "Home") {
        nextValue = 0;
      } else if (event.key === "End") {
        nextValue = 1;
      } else {
        return;
      }

      event.preventDefault();
      setSliderValue(nextValue, true);
      window.setTimeout(() => {
        triggerButtonPressHaptic();
      }, 0);
    };

    const handleWindowPointerMove = (event: PointerEvent) => {
      if (!isSliderDragging || activeSliderPointerId !== event.pointerId) {
        return;
      }
      updateSliderFromPointer(event);
    };

    const handleWindowPointerUp = (event: PointerEvent) => {
      finishSliderDrag(event.pointerId);
      if (activeTogglePointerId === event.pointerId) {
        const shouldToggle = isToggleReleaseInside(event.clientX, event.clientY);
        endTogglePress(event.pointerId);
        if (shouldToggle) {
          toggleDoubleEnabled();
        }
      } else {
        endTogglePress(event.pointerId);
      }

      if (activeShutterPointerId === event.pointerId) {
        activeShutterPointerId = null;
        if (endShutterPress(true)) {
          runShutterCommitFlow();
        }
      }
    };

    const handleWindowPointerCancel = (event: PointerEvent) => {
      finishSliderDrag(event.pointerId);
      endTogglePress(event.pointerId);

      if (activeShutterPointerId === event.pointerId) {
        activeShutterPointerId = null;
        endShutterPress(false);
      }
    };

    const handleSliderBlur = () => {
      isSliderDragging = false;
      activeSliderPointerId = null;
      sliderControl.classList.remove("is-dragging");
    };

    const handleToggleBlur = () => {
      endTogglePress(null);
    };

    const handleShutterBlur = () => {
      activeShutterPointerId = null;
      endShutterPress(false);
    };

    pressDarken?.style.setProperty("transition", "fill-opacity 140ms cubic-bezier(0.18, 0.85, 0.28, 1)");

    sliderControl.classList.add("is-dragging");
    sliderValue = 0;
    doubleEnabled = false;
    pendingSecondShot = false;
    sliderLocked = false;
    syncAllVisuals();
    window.requestAnimationFrame(() => {
      sliderControl.classList.remove("is-dragging");
    });

    sliderControl.addEventListener("pointerdown", handleSliderPointerDown);
    sliderControl.addEventListener("keydown", handleSliderKeyDown);
    sliderControl.addEventListener("blur", handleSliderBlur);

    toggleButton.addEventListener("pointerdown", handleTogglePointerDown);
    toggleButton.addEventListener("keydown", handleToggleKeyDown);
    toggleButton.addEventListener("keyup", handleToggleKeyUp);
    toggleButton.addEventListener("blur", handleToggleBlur);

    shutterButton.addEventListener("pointerdown", handleShutterPointerDown);
    shutterButton.addEventListener("pointerleave", handleShutterPointerLeave);
    shutterButton.addEventListener("keydown", handleShutterKeyDown);
    shutterButton.addEventListener("keyup", handleShutterKeyUp);
    shutterButton.addEventListener("blur", handleShutterBlur);

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerCancel);

    return () => {
      sliderControl.removeEventListener("pointerdown", handleSliderPointerDown);
      sliderControl.removeEventListener("keydown", handleSliderKeyDown);
      sliderControl.removeEventListener("blur", handleSliderBlur);

      toggleButton.removeEventListener("pointerdown", handleTogglePointerDown);
      toggleButton.removeEventListener("keydown", handleToggleKeyDown);
      toggleButton.removeEventListener("keyup", handleToggleKeyUp);
      toggleButton.removeEventListener("blur", handleToggleBlur);

      shutterButton.removeEventListener("pointerdown", handleShutterPointerDown);
      shutterButton.removeEventListener("pointerleave", handleShutterPointerLeave);
      shutterButton.removeEventListener("keydown", handleShutterKeyDown);
      shutterButton.removeEventListener("keyup", handleShutterKeyUp);
      shutterButton.removeEventListener("blur", handleShutterBlur);

      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerCancel);

      isSliderDragging = false;
      activeSliderPointerId = null;
      isTogglePressed = false;
      activeTogglePointerId = null;
      isShutterPressed = false;
      activeShutterPointerId = null;

      sliderControl.classList.remove("is-dragging", "is-locked");
      toggleButton.classList.remove("is-pressed", "is-on");
      shutterButton.classList.remove("is-pressed", "is-disabled");
      setShutterPressed(false);
    };
  }, [onCommit]);

  return null;
}
