import type * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[var(--badge-border)] bg-[var(--badge-bg)] px-2 py-0.5 text-xs font-medium text-[var(--badge-fg)]",
        className
      )}
      {...props}
    />
  );
}
