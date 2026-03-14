import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LatentViewfinder } from "@/components/camera/latent-viewfinder";
import { LatentButtonInteraction } from "@/components/camera/latent-button-interaction";
import { SharedButtonInteraction } from "@/components/camera/shared-button-interaction";
import { ShutterInteraction } from "@/components/camera/shutter-interaction";
import { TuiControlsInteraction } from "@/components/camera/tui-controls-interaction";

export default function HomePage() {
  const latentCameraSvg = readFileSync(join(process.cwd(), "public/ui/latent-camera-itself.svg"), "utf8");

  return (
    <main className="app-sheet latent-layout-page">
      <section className="latent-layout-canvas" aria-label="Latent camera interface">
        <div className="latent-layout-artwork" dangerouslySetInnerHTML={{ __html: latentCameraSvg }} />
        <LatentViewfinder chrome="bare" showOverlay={false} shellClassName="latent-layout-viewfinder-window" />
      </section>
      <ShutterInteraction />
      <SharedButtonInteraction />
      <LatentButtonInteraction />
      <TuiControlsInteraction />
    </main>
  );
}
