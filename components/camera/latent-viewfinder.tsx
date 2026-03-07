"use client";

import { Capacitor } from "@capacitor/core";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState, type MutableRefObject } from "react";
import type { LensId } from "@/data/lenses";
import { LatentCamera, type CaptureFrameResult } from "@/lib/native/latentCamera";

export interface ViewfinderCaptureResult {
  masterUri: string;
  derivativeUri: string | null;
}

export interface LatentViewfinderHandle {
  captureFrame: (lensId: LensId) => Promise<ViewfinderCaptureResult>;
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

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#20343a");
  gradient.addColorStop(1, "#0a1216");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#e8f1f5";
  context.font = "32px Menlo";
  context.fillText(`LATENT ${new Date().toISOString()}`, 42, height / 2);

  return {
    masterUri: await toDataUrl(canvas, "image/png"),
    derivativeUri: await toDataUrl(canvas, "image/jpeg", 0.85),
    width,
    height
  };
}

export const LatentViewfinder = forwardRef<LatentViewfinderHandle>(function LatentViewfinder(_props, ref) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ready = useWebCamera(videoRef);

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

        if (!videoRef.current) {
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
    []
  );

  const helperText = useMemo(() => {
    if (Capacitor.isNativePlatform()) {
      return "Native camera active";
    }

    return ready ? "Live preview" : "Camera permission required";
  }, [ready]);

  return (
    <div className="viewfinder">
      <video ref={videoRef} playsInline muted aria-label="Latent camera preview" />
      <div className="ui-overlay-chip absolute bottom-2 left-2 px-2 py-1 text-[0.65rem]">{helperText}</div>
    </div>
  );
});
