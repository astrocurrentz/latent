import type * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export function Slider({ className, label, min = 0, max = 100, ...props }: SliderProps) {
  return (
    <label className="ds-slider-shell">
      {label ? <span className="ds-label">{label}</span> : null}
      <input type="range" min={min} max={max} className={cn("ds-slider", className)} {...props} />
    </label>
  );
}
