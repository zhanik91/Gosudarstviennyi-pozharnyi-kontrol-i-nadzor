"use client";
import { cn } from "@/utils/cn";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col h-[100vh] items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-slate-950 transition-bg",
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950",
              showRadialGradient &&
                "[mask-image:radial-gradient(ellipse_at_80%_0%,rgba(0,0,0,0.2)_10%,transparent_65%)]"
            )}
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.15),transparent_30%),radial-gradient(circle_at_40%_80%,rgba(59,130,246,0.1),transparent_28%)]"
          />
        </div>
        {children}
      </div>
    </main>
  );
};
