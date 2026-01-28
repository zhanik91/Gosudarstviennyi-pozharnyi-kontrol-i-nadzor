import { ReactNode } from "react";

import { CardContent } from "@/components/ui/card";
import { PortalCard } from "@/components/ui/portal-card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: ReactNode;
  dataTestId: string;
}

export default function StatsCard({
  icon: Icon,
  iconColor,
  label,
  value,
  dataTestId
}: StatsCardProps) {
  return (
    <PortalCard>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <Icon className={`h-8 w-8 ${iconColor}`} />
          <div>
            <div className="text-2xl font-bold" data-testid={dataTestId}>
              {value}
            </div>
            <div className="text-sm text-muted-foreground">
              {label}
            </div>
          </div>
        </div>
      </CardContent>
    </PortalCard>
  );
}
