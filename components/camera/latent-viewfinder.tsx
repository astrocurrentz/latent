"use client";

import { Capacitor } from "@capacitor/core";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type MutableRefObject } from "react";
import type { LensId } from "@/data/lenses";
import { LatentCamera, type CaptureFrameResult, type PreviewLayout } from "@/lib/native/latentCamera";
import { cn } from "@/lib/utils";
import { ScreenWrapper } from "@/src/design-system/components";

export interface ViewfinderCaptureResult {
  masterUri: string;
  derivativeUri: string | null;
}

export interface LatentViewfinderHandle {
  captureFrame: (lensId: LensId) => Promise<ViewfinderCaptureResult>;
}

interface LatentViewfinderProps {
  chrome?: "framed" | "bare";
  className?: string;
  shellClassName?: string;
}

function useWebCamera(videoRef: MutableRefObject<HTMLVideoElement | null>) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment"
          },
          audio: false
        });

        if (!active || !videoRef.current) {
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      } catch {
        setReady(false);
      }
    };

    if (!Capacitor.isNativePlatform()) {
      void start();
    }

    return () => {
      active = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [videoRef]);

  return ready;
}

function useNativePreview(viewfinderRef: MutableRefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
    if (!isNativeIOS) {
      return;
    }

    let active = true;
    let frameId = 0;

    const toLayout = (element: HTMLDivElement): PreviewLayout | null => {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return null;
      }

      const computedStyles = window.getComputedStyle(element);
      const cornerRadius = Number.parseFloat(computedStyles.borderTopLeftRadius || "0");

      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        scale: window.devicePixelRatio || 1,
        cornerRadius: Number.isFinite(cornerRadius) ? Math.max(cornerRadius, 0) : 0
      };
    };

    const updateLayout = async () => {
      if (!active || !viewfinderRef.current) {
        return;
      }

      const layout = toLayout(viewfinderRef.current);
      if (!layout) {
        return;
      }

      try {
        await LatentCamera.updatePreviewLayout({ layout });
      } catch {
        // Keep silent fallback behavior; the black viewfinder remains visible.
      }
    };

    const startPreview = async () => {
      if (!active || !viewfinderRef.current) {
        return;
      }

      const layout = toLayout(viewfinderRef.current);
      if (!layout) {
        frameId = window.requestAnimationFrame(() => {
          void startPreview();
        });
        return;
      }

      try {
        await LatentCamera.startPreview({
          layout,
          cameraPreference: "rearPrimary",
          distortion: {
            enabled: true,
            strength: "medium"
          }
        });
      } catch {
        // Keep silent fallback behavior; the black viewfinder remains visible.
      }
    };

    const handleResize = () => {
      void updateLayout();
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            void updateLayout();
          });

    frameId = window.requestAnimationFrame(() => {
      void startPreview();
    });

    if (viewfinderRef.current && resizeObserver) {
      resizeObserver.observe(viewfinderRef.current);
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
      void LatentCamera.stopPreview().catch(() => undefined);
    };
  }, [viewfinderRef]);
}

async function toDataUrl(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode frame."));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result !== "string") {
            reject(new Error("Failed to serialize frame."));
            return;
          }
          resolve(reader.result);
        };
        reader.onerror = () => reject(new Error("Failed to read encoded frame."));
        reader.readAsDataURL(blob);
      },
      type,
      quality
    );
  });
}

async function captureFromWeb(video: HTMLVideoElement): Promise<CaptureFrameResult> {
  const width = video.videoWidth || 1280;
  const height = video.videoHeight || 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to access camera canvas context.");
  }

  context.drawImage(video, 0, 0, width, height);

  return {
    masterUri: await toDataUrl(canvas, "image/png"),
    derivativeUri: await toDataUrl(canvas, "image/jpeg", 0.85),
    width,
    height
  };
}

async function syntheticCapture(): Promise<CaptureFrameResult> {
  const width = 1280;
  const height = 720;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to access synthetic camera context.");
  }

  context.fillStyle = "#0a0a0a";
  context.fillRect(0, 0, width, height);

  return {
    masterUri: await toDataUrl(canvas, "image/png"),
    derivativeUri: await toDataUrl(canvas, "image/jpeg", 0.85),
    width,
    height
  };
}

export const LatentViewfinder = forwardRef<LatentViewfinderHandle, LatentViewfinderProps>(function LatentViewfinder(
  { chrome = "framed", className, shellClassName },
  ref
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const viewfinderRef = useRef<HTMLDivElement | null>(null);
  const ready = useWebCamera(videoRef);

  useNativePreview(viewfinderRef);

  useImperativeHandle(
    ref,
    () => ({
      async captureFrame(lensId: LensId) {
        if (Capacitor.isNativePlatform()) {
          const nativeResult = await LatentCamera.captureFrame({ lensId });
          return {
            masterUri: nativeResult.masterUri,
            derivativeUri: nativeResult.derivativeUri
          };
        }

        if (!videoRef.current || !ready) {
          return syntheticCapture();
        }

        if (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) {
          return syntheticCapture();
        }

        const webResult = await captureFromWeb(videoRef.current);
        return {
          masterUri: webResult.masterUri,
          derivativeUri: webResult.derivativeUri
        };
      }
    }),
    [ready]
  );

  const livePreview = (
    <div ref={viewfinderRef} className={cn("viewfinder", className)}>
      <video ref={videoRef} playsInline muted aria-label="Latent camera preview" />
    </div>
  );

  if (chrome === "bare") {
    return <div className={cn("viewfinder-shell-bare", shellClassName)}>{livePreview}</div>;
  }

  return (
    <div className={cn("viewfinder-shell", shellClassName)}>
      <ScreenWrapper className="viewfinder-frame" screenClassName="viewfinder-screen">
        {livePreview}
      </ScreenWrapper>
    </div>
  );
});
