import type * as React from "react";
import { cn } from "@/lib/utils";

export interface DisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "default" | "muted";
}

export function Display({ className, tone = "default", ...props }: DisplayProps) {
  return <div data-tone={tone} className={cn("ds-display", className)} {...props} />;
}
