import type * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

export function Switch({ className, checked = false, onCheckedChange, label, onClick, type = "button", ...props }: SwitchProps) {
  return (
    <label className="ds-switch-shell">
      {label ? <span className="ds-label">{label}</span> : null}
      <button
        {...props}
        type={type}
        role="switch"
        aria-checked={checked}
        data-state={checked ? "on" : "off"}
        className={cn("ds-switch", className)}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) {
            return;
          }
          onCheckedChange?.(!checked);
        }}
      >
        <span className="ds-switch-thumb" />
      </button>
    </label>
  );
}
