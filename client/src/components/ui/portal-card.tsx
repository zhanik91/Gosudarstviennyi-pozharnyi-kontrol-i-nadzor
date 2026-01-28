import * as React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const portalCardClassName =
  "border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md";

const PortalCard = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof Card>
>(({ className, ...props }, ref) => (
  <Card ref={ref} className={cn(portalCardClassName, className)} {...props} />
));
PortalCard.displayName = "PortalCard";

export { PortalCard, portalCardClassName };
