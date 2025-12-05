import * as React from "react";
import { cn } from "@/lib/utils";
import mchsEmblemImage from "@assets/mchs-emblem_1764948285012.png";

export type MchsEmblemProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  title?: string;
};

export function MchsEmblem({
  className,
  title = "Эмблема МЧС",
  ...props
}: MchsEmblemProps) {
  return (
    <img
      src={mchsEmblemImage}
      alt={title}
      className={cn("h-10 w-10 object-contain", className)}
      {...props}
    />
  );
}

export default MchsEmblem;
