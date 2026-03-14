import type * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  dimmed?: boolean;
}

export function Label({ className, dimmed = false, ...props }: LabelProps) {
  return <span data-dimmed={dimmed ? "true" : "false"} className={cn("ds-label", className)} {...props} />;
}
