import { registerPlugin } from "@capacitor/core";

export interface CaptureFrameResult {
  masterUri: string;
  derivativeUri: string | null;
  width: number;
  height: number;
}

export interface PreviewLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  cornerRadius?: number;
}

export interface PreviewDistortionOptions {
  enabled: boolean;
  strength: "low" | "medium" | "high" | number;
}

export interface StartPreviewOptions {
  layout: PreviewLayout;
  cameraPreference: "rearPrimary";
  distortion: PreviewDistortionOptions;
}

export interface UpdatePreviewLayoutOptions {
  layout: PreviewLayout;
}

interface LatentCameraPlugin {
  startPreview(options: StartPreviewOptions): Promise<void>;
  updatePreviewLayout(options: UpdatePreviewLayoutOptions): Promise<void>;
  stopPreview(): Promise<void>;
  captureFrame(options: { lensId: string }): Promise<CaptureFrameResult>;
}

export const LatentCamera = registerPlugin<LatentCameraPlugin>("LatentCamera");
