"use client";

import { useEffect } from "react";
import { triggerButtonPressHaptic } from "@/lib/native/haptics";

type RectShape = {
  height: string;
  rx: string;
  width: string;
  x: string;
  y: string;
};

const BASE_REST: RectShape = { x: "87", y: "178", width: "37.7778", height: "21.1111", rx: "6" };
const BASE_PRESSED: RectShape = { x: "87.35", y: "178.2", width: "37.0778", height: "20.7111", rx: "5.75" };

const SURFACE_REST: RectShape = { x: "88", y: "179", width: "35.5556", height: "18.8889", rx: "6" };
const SURFACE_PRESSED: RectShape = { x: "88.35", y: "179.2", width: "34.8556", height: "18.4889", rx: "5.75" };

const STATUS_GLOW_REST: RectShape = { x: "102", y: "188", width: "8", height: "2", rx: "1" };
const STATUS_GLOW_PRESSED: RectShape = { x: "102.2", y: "188.12", width: "7.6", height: "1.76", rx: "0.88" };

const STATUS_CORE_REST: RectShape = { x: "102", y: "188", width: "8", height: "2", rx: "1" };
const STATUS_CORE_PRESSED: RectShape = { x: "102.2", y: "188.12", width: "7.6", height: "1.76", rx: "0.88" };

const STATUS_OVERLAY_REST: RectShape = { x: "102", y: "188", width: "8", height: "2", rx: "1" };
const STATUS_OVERLAY_PRESSED: RectShape = { x: "102.2", y: "188.12", width: "7.6", height: "1.76", rx: "0.88" };

const STATUS_RIM_REST: RectShape = { x: "102.05", y: "188.05", width: "7.9", height: "1.9", rx: "0.95" };
const STATUS_RIM_PRESSED: RectShape = { x: "102.22", y: "188.17", width: "7.54", height: "1.66", rx: "0.83" };

function setRectShape(node: SVGRectElement | null, shape: RectShape) {
  if (!node) {
    return;
  }
  node.setAttribute("x", shape.x);
  node.setAttribute("y", shape.y);
  node.setAttribute("width", shape.width);
  node.setAttribute("height", shape.height);
  node.setAttribute("rx", shape.rx);
}

export function LatentButtonInteraction() {
  useEffect(() => {
    const latentButton = document.querySelector<SVGGElement>("#latent-button");
    const hitTarget = document.querySelector<SVGRectElement>("#latent-button-hit");
    const base = document.querySelector<SVGRectElement>("#latent-button-base");
    const surface = document.querySelector<SVGRectElement>("#latent-button-surface");
    const pressDarken = document.querySelector<SVGRectElement>("#latent-button-press-darken");
    const statusGlow = document.querySelector<SVGRectElement>("#latent-button-status-glow");
    const statusCore = document.querySelector<SVGRectElement>("#latent-button-status-core");
    const statusOverlay = document.querySelector<SVGRectElement>("#latent-button-status-overlay");
    const statusRim = document.querySelector<SVGRectElement>("#latent-button-status-rim");

    if (!latentButton) {
      return;
    }

    let isPressed = false;
    let isOn = latentButton.classList.contains("is-latent-on");
    let suppressNextClick = false;
    const releaseTiming = "130ms cubic-bezier(0.18, 0.85, 0.28, 1)";

    const syncTransitionTiming = (pressed: boolean) => {
      const rectTransition = pressed
        ? "x 0ms linear, y 0ms linear, width 0ms linear, height 0ms linear, rx 0ms linear"
        : `x ${releaseTiming}, y ${releaseTiming}, width ${releaseTiming}, height ${releaseTiming}, rx ${releaseTiming}`;

      base?.style.setProperty("transition", rectTransition);
      surface?.style.setProperty("transition", rectTransition);
      pressDarken?.style.setProperty(
        "transition",
        pressed ? `${rectTransition}, fill-opacity 0ms linear` : `${rectTransition}, fill-opacity ${releaseTiming}`
      );
      statusGlow?.style.setProperty(
        "transition",
        pressed ? `${rectTransition}, opacity 0ms linear` : `${rectTransition}, opacity ${releaseTiming}`
      );
      statusCore?.style.setProperty(
        "transition",
        pressed ? `${rectTransition}, fill 0ms linear` : `${rectTransition}, fill ${releaseTiming}`
      );
      statusOverlay?.style.setProperty(
        "transition",
        pressed ? `${rectTransition}, opacity 0ms linear` : `${rectTransition}, opacity ${releaseTiming}`
      );
      statusRim?.style.setProperty("transition", rectTransition);
    };

    const setPressed = (pressed: boolean) => {
      syncTransitionTiming(pressed);
      latentButton.classList.toggle("is-pressed", pressed);
      setRectShape(base, pressed ? BASE_PRESSED : BASE_REST);
      setRectShape(surface, pressed ? SURFACE_PRESSED : SURFACE_REST);
      setRectShape(pressDarken, pressed ? SURFACE_PRESSED : SURFACE_REST);
      pressDarken?.setAttribute("fill-opacity", pressed ? "0.2" : "0");
      setRectShape(statusGlow, pressed ? STATUS_GLOW_PRESSED : STATUS_GLOW_REST);
      setRectShape(statusCore, pressed ? STATUS_CORE_PRESSED : STATUS_CORE_REST);
      setRectShape(statusOverlay, pressed ? STATUS_OVERLAY_PRESSED : STATUS_OVERLAY_REST);
      setRectShape(statusRim, pressed ? STATUS_RIM_PRESSED : STATUS_RIM_REST);
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

    const syncState = () => {
      latentButton.classList.toggle("is-latent-on", isOn);
      latentButton.setAttribute("aria-pressed", isOn ? "true" : "false");
      statusGlow?.setAttribute("opacity", isOn ? "0.85" : "0");
      statusCore?.setAttribute("fill", isOn ? "#DD8943" : "#999999");
      statusOverlay?.setAttribute("opacity", isOn ? "0" : "1");
    };

    const toggleState = () => {
      isOn = !isOn;
      syncState();
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
      toggleState();
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
        toggleState();
        suppressNextClick = true;
      }
    };

    const handleBlur = () => {
      isPressed = false;
      setPressed(false);
    };

    latentButton.style.pointerEvents = "all";
    latentButton.style.cursor = "pointer";
    latentButton.style.touchAction = "manipulation";
    latentButton.style.setProperty("-webkit-tap-highlight-color", "transparent");
    hitTarget?.style.setProperty("pointer-events", "all");
    hitTarget?.style.setProperty("cursor", "pointer");

    syncTransitionTiming(false);

    syncState();

    latentButton.addEventListener("pointerdown", handlePointerDown);
    latentButton.addEventListener("pointerleave", handlePointerUp);
    latentButton.addEventListener("pointercancel", handlePointerUp);
    latentButton.addEventListener("touchstart", handleTouchStart, { passive: true });
    latentButton.addEventListener("touchend", handlePointerUp, { passive: true });
    latentButton.addEventListener("touchcancel", handlePointerUp, { passive: true });
    latentButton.addEventListener("click", handleClick);
    latentButton.addEventListener("keydown", handleKeyDown);
    latentButton.addEventListener("keyup", handleKeyUp);
    latentButton.addEventListener("blur", handleBlur);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("touchend", handlePointerUp, { passive: true });
    window.addEventListener("touchcancel", handlePointerUp, { passive: true });

    return () => {
      latentButton.removeEventListener("pointerdown", handlePointerDown);
      latentButton.removeEventListener("pointerleave", handlePointerUp);
      latentButton.removeEventListener("pointercancel", handlePointerUp);
      latentButton.removeEventListener("touchstart", handleTouchStart);
      latentButton.removeEventListener("touchend", handlePointerUp);
      latentButton.removeEventListener("touchcancel", handlePointerUp);
      latentButton.removeEventListener("click", handleClick);
      latentButton.removeEventListener("keydown", handleKeyDown);
      latentButton.removeEventListener("keyup", handleKeyUp);
      latentButton.removeEventListener("blur", handleBlur);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
      window.removeEventListener("touchcancel", handlePointerUp);
      isPressed = false;
      setPressed(false);
    };
  }, []);

  return null;
}
