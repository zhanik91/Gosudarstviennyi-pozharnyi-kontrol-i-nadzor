import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { LucideIcon } from "lucide-react";

interface ModuleCardProps {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  primaryAction: {
    label: string;
    href?: string;
    disabled?: boolean;
  };
  secondaryActions?: Array<{
    label: string;
    href: string;
  }>;
}

export default function ModuleCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  primaryAction,
  secondaryActions = []
}: ModuleCardProps) {
  return (
    <Card className="bg-gradient-to-br from-card to-card/80 border border-border hover-lift">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {primaryAction.href && !primaryAction.disabled ? (
            <Link to={primaryAction.href}>
              <Button className="w-full" data-testid={`module-${title.toLowerCase().replace(/\s+/g, '-')}`}>
                {primaryAction.label}
              </Button>
            </Link>
          ) : (
            <Button 
              className="w-full" 
              disabled={primaryAction.disabled}
              data-testid={`module-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {primaryAction.label}
            </Button>
          )}
          
          {secondaryActions.length > 0 && (
            <div className="flex gap-2">
              {secondaryActions.map((action, index) => (
                <Link key={index} to={action.href}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    data-testid={`action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}