import { registerPlugin } from "@capacitor/core";

export interface CaptureFrameResult {
  masterUri: string;
  derivativeUri: string | null;
  width: number;
  height: number;
}

interface LatentCameraPlugin {
  captureFrame(options: { lensId: string }): Promise<CaptureFrameResult>;
}

export const LatentCamera = registerPlugin<LatentCameraPlugin>("LatentCamera");
