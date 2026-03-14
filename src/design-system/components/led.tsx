import type * as React from "react";
import { cn } from "@/lib/utils";

export type LedStatus = "off" | "standby" | "active" | "warning" | "error";

export interface LedProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: LedStatus;
}

export function LED({ className, status = "off", ...props }: LedProps) {
  return <span aria-label={`led-${status}`} data-status={status} className={cn("ds-led", className)} {...props} />;
}
