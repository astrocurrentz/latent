import type * as React from "react";
import { cn } from "@/lib/utils";

export type PanelTone = "default" | "sunken" | "elevated";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: PanelTone;
}

export function Panel({ className, tone = "default", ...props }: PanelProps) {
  return <div data-tone={tone} className={cn("ds-panel", className)} {...props} />;
}
