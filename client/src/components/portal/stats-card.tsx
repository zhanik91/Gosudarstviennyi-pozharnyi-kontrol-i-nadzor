import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StatsCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string;
  dataTestId: string;
}

export default function StatsCard({
  icon: Icon,
  iconColor,
  label,
  value,
  dataTestId
}: StatsCardProps) {
  // Получение актуальной статистики
  const { data: stats } = useQuery({
    queryKey: ['/api/stats/dashboard'],
    refetchInterval: 30000, // Обновление каждые 30 секунд
    retry: false
  });

  // Определение значения в зависимости от типа статистики
  const getValue = () => {
    if (!stats) return '—';
    
    switch (dataTestId) {
      case 'stat-incidents':
        return (stats as any)?.incidents?.toString() || '0';
      case 'stat-packages':
        return '12'; // Демо-значение для пакетов
      case 'stat-users':
        return '8'; // Демо-значение для пользователей
      case 'stat-reports':
        return (stats as any)?.reports?.toString() || '0';
      default:
        return value;
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <Icon className={`h-8 w-8 ${iconColor}`} />
          <div>
            <div className="text-2xl font-bold" data-testid={dataTestId}>
              {getValue()}
            </div>
            <div className="text-sm text-muted-foreground">
              {label}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}