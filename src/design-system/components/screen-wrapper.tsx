import type * as React from "react";
import { cn } from "@/lib/utils";

export interface ScreenWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  screenClassName?: string;
}

export function ScreenWrapper({ className, screenClassName, children, ...props }: ScreenWrapperProps) {
  return (
    <div className={cn("ds-screen-wrapper", className)} {...props}>
      <div className={cn("ds-screen-wrapper-screen", screenClassName)}>{children}</div>
    </div>
  );
}
