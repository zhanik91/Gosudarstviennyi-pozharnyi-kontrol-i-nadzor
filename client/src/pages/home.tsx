import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/layout/footer";
import ModuleCard from "@/components/portal/module-card";
import StatsCard from "@/components/portal/stats-card";
import { SimpleActions } from "@/components/navigation/simple-actions";
import { Shield, Building, FileText, Activity, Package, Users, FileCheck } from "lucide-react";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const {
    data: metrics,
    isLoading: metricsLoading,
    isError: metricsError,
  } = useDashboardMetrics();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground portal-bg">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка портала...</p>
          </div>
        </div>
      </div>
    );
  }

  const renderMetricValue = (value?: number) => {
    if (metricsLoading) {
      return <div className="h-7 w-16 rounded bg-muted animate-pulse" />;
    }

    if (metricsError) {
      return "Нет данных";
    }

    if (value === undefined || value === null) {
      return "—";
    }

    return value.toLocaleString("ru-RU");
  };

  return (
    <div className="min-h-screen bg-background text-foreground portal-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Простые действия */}
        <SimpleActions />
        <div className="space-y-8 fade-in">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Добро пожаловать в портал</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Единая цифровая платформа пожарной безопасности для мониторинга, государственного контроля и контроля, формирование отчетности КПС МЧС РК
            </p>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModuleCard
              icon={Shield}
              iconBg="bg-primary/20"
              iconColor="text-primary"
              title="Государственный учёт пожаров"
              description="Журнал выездов, отчёты, еженедельные сведения и диаграммы"
              primaryAction={{
                label: "Открыть модуль",
                href: "/fire-module"
              }}
              secondaryActions={[
                { label: "Карты", href: "/fire-module?tab=maps" },
                { label: "Отчёты", href: "/fire-module?tab=reports" },
                { label: "Журнал", href: "/fire-module?tab=journal" }
              ]}
            />

            <ModuleCard
              icon={Building}
              iconBg="bg-accent/20"
              iconColor="text-accent"
              title="Государственный контроль и надзор"
              description="Реестр объектов контроля, учёт проверок, предписаний и сроков их исполнения"
              primaryAction={{
                label: "Открыть модуль",
                href: "/controlled-objects"
              }}
              secondaryActions={[
                { label: "Документация", href: "#" },
                { label: "Графики проверок", href: "#" }
              ]}
            />

            <ModuleCard
              icon={FileText}
              iconBg="bg-green-500/20"
              iconColor="text-green-400"
              title="Нормативные документы"
              description="Помощник госинспектора: ключевые НПА, методики, приказы, правила и регламенты"
              primaryAction={{
                label: "Открыть НПА",
                href: "/regulatory-documents"
              }}
              secondaryActions={[
                { label: "Основные НПА", href: "#" },
                { label: "Приказы МЧС", href: "#" },
                { label: "Техрегламенты/СНиП/СП", href: "#" }
              ]}
            />

            <ModuleCard
              icon={FileCheck}
              iconBg="bg-orange-500/20"
              iconColor="text-orange-400"
              title="Журнал заключений аудитов"
              description="Учёт заключений аудитов в области пожарной безопасности, импорт/экспорт данных, период освобождения от проверок"
              primaryAction={{
                label: "Открыть журнал",
                href: "/audit-conclusions"
              }}
              secondaryActions={[
                { label: "Импорт", href: "/audit-conclusions" },
                { label: "Экспорт", href: "/audit-conclusions" }
              ]}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={Activity}
              iconColor="text-primary"
              label="Инциденты за месяц"
              value={renderMetricValue(metrics?.incidents)}
              dataTestId="stat-incidents"
            />
            <StatsCard
              icon={Package}
              iconColor="text-accent"
              label="Активные пакеты"
              value={renderMetricValue(metrics?.packages)}
              dataTestId="stat-packages"
            />
            <StatsCard
              icon={Users}
              iconColor="text-green-400"
              label="Пользователи онлайн"
              value={renderMetricValue(metrics?.usersOnline)}
              dataTestId="stat-users"
            />
            <StatsCard
              icon={FileCheck}
              iconColor="text-blue-400"
              label="Отчёты готовы"
              value={renderMetricValue(metrics?.reportsReady)}
              dataTestId="stat-reports"
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
