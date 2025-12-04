import * as React from "react";
import { cn } from "@/lib/utils";

export type MchsEmblemProps = React.SVGAttributes<SVGSVGElement> & {
  title?: string;
};

export function MchsEmblem({
  className,
  title = "Эмблема МЧС",
  ...props
}: MchsEmblemProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={cn("h-10 w-10", className)}
      {...props}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="mchs-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0f5a9d" />
          <stop offset="100%" stopColor="#1da1f2" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#mchs-gradient)" />
      <circle
        cx="32"
        cy="32"
        r="23"
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="2"
        strokeDasharray="4 6"
        strokeLinecap="round"
      />
      <path
        d="M32 12 37 28h15L40 38l5 14-13-8-13 8 5-14-12-10h15z"
        fill="#f7b733"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="5" fill="#fff" />
      <circle cx="32" cy="32" r="2.5" fill="#f7b733" />
    </svg>
  );
}

export default MchsEmblem;
