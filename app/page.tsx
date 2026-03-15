import { readFileSync } from "node:fs";
import { join } from "node:path";
import { LatentCameraShell } from "@/components/camera/latent-camera-shell";

export default function HomePage() {
  const latentCameraSvg = readFileSync(join(process.cwd(), "public/ui/latent-camera-itself.svg"), "utf8");

  return <LatentCameraShell latentCameraSvg={latentCameraSvg} />;
}
