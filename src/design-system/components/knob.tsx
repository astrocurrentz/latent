import type * as React from "react";
import { cn } from "@/lib/utils";

export interface KnobProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  value?: number;
  size?: string;
  label?: string;
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function Knob({ className, value = 0.5, size = "3rem", label, ...props }: KnobProps) {
  const normalized = clamp(value);
  const angle = -130 + normalized * 260;
  const style = {
    "--ds-knob-angle": `${angle}deg`,
    "--ds-knob-size": size
  } as React.CSSProperties;

  return (
    <div className={cn("ds-knob-shell", className)} {...props}>
      <div className="ds-knob" style={style} aria-hidden="true">
        <span className="ds-knob-indicator" />
      </div>
      {label ? <span className="ds-label">{label}</span> : null}
    </div>
  );
}
