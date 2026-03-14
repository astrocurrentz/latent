import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

function triggerImpact(style: ImpactStyle, webDurationMs: number) {
  if (typeof window === "undefined") {
    return;
  }

  if (Capacitor.getPlatform() === "web") {
    navigator.vibrate?.(webDurationMs);
    return;
  }

  void Haptics.impact({ style }).catch(() => {
    // Ignore failures from unsupported devices/platform states.
  });
}

export function triggerButtonPressHaptic() {
  triggerImpact(ImpactStyle.Light, 8);
}

export function triggerShutterReleaseHaptic() {
  triggerImpact(ImpactStyle.Light, 6);
}
