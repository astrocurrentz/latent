"use client";

import { useCallback, useRef } from "react";
import type { LensId } from "@/data/lenses";
import { LatentButtonInteraction } from "@/components/camera/latent-button-interaction";
import { LensSelectionInteraction } from "@/components/camera/lens-selection-interaction";
import { LatentViewfinder, type LatentViewfinderHandle } from "@/components/camera/latent-viewfinder";
import { SharedButtonInteraction } from "@/components/camera/shared-button-interaction";
import { ShutterInteraction } from "@/components/camera/shutter-interaction";
import { TuiControlsInteraction } from "@/components/camera/tui-controls-interaction";

type SelectableLensId = Exclude<LensId, "plain">;

interface LatentCameraShellProps {
  latentCameraSvg: string;
}

export function LatentCameraShell({ latentCameraSvg }: LatentCameraShellProps) {
  const viewfinderRef = useRef<LatentViewfinderHandle | null>(null);
  const selectedLensRef = useRef<SelectableLensId | null>(null);

  const handleShutterCommit = useCallback(() => {
    const captureLensId: LensId = selectedLensRef.current ?? "plain";
    void viewfinderRef.current?.captureFrame(captureLensId).catch(() => undefined);
  }, []);

  return (
    <main className="app-sheet latent-layout-page">
      <section className="latent-layout-canvas" aria-label="Latent camera interface">
        <div className="latent-layout-artwork" dangerouslySetInnerHTML={{ __html: latentCameraSvg }} />
        <LatentViewfinder ref={viewfinderRef} chrome="bare" showOverlay={false} shellClassName="latent-layout-viewfinder-window" />
      </section>
      <ShutterInteraction onCommit={handleShutterCommit} />
      <SharedButtonInteraction />
      <LatentButtonInteraction />
      <TuiControlsInteraction />
      <LensSelectionInteraction selectedLensRef={selectedLensRef} />
    </main>
  );
}
