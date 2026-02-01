import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/layout/footer";
import ModuleCard from "@/components/portal/module-card";
import StatsCard from "@/components/portal/stats-card";
import { SimpleActions } from "@/components/navigation/simple-actions";
import { Shield, Building, Activity, Users, FileCheck, Scale, BookOpen, Calculator, Bot } from "lucide-react";
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
              Единая цифровая платформа пожарной безопасности для мониторинга, государственного контроля и надзора, формирование отчетности КПС МЧС РК
            </p>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ModuleCard
              icon={Shield}
              iconBg="bg-primary/20"
              iconColor="text-primary"
              title="Государственный учёт пожаров"
              description="Журнал выездов, отчёты и диаграммы"
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
              description="Реестр объектов, учёт проверок и предписаний"
              primaryAction={{
                label: "Открыть модуль",
                href: "/controlled-objects"
              }}
              secondaryActions={[
                { label: "Реестр объектов", href: "/controlled-objects?tab=registry" },
                { label: "Списки проверок", href: "/controlled-objects?tab=preventive" }
              ]}
            />

            <ModuleCard
              icon={FileCheck}
              iconBg="bg-orange-500/20"
              iconColor="text-orange-400"
              title="Журналы и списки"
              description="Аудиты и противопожарные службы"
              primaryAction={{
                label: "Открыть модуль",
                href: "/journals-lists",
              }}
              secondaryActions={[
                { label: "Аудиты", href: "/journals-lists?tab=audits" },
                { label: "ППС", href: "/journals-lists?tab=pps" }
              ]}
            />

            <ModuleCard
              icon={Scale}
              iconBg="bg-purple-500/20"
              iconColor="text-purple-400"
              title="Административная практика"
              description="Журнал практики и отчёты с фото"
              primaryAction={{
                label: "Открыть модуль",
                href: "/admin-practice"
              }}
              secondaryActions={[
                { label: "Журнал", href: "/admin-practice?tab=journal" },
                { label: "Отчёты", href: "/admin-practice?tab=reports" }
              ]}
            />

            <ModuleCard
              icon={BookOpen}
              iconBg="bg-blue-500/20"
              iconColor="text-blue-400"
              title="Нормативные документы"
              description="База НПА и законодательства РК"
              primaryAction={{
                label: "Открыть модуль",
                href: "/normative-documents"
              }}
              secondaryActions={[
                { label: "Законы", href: "/normative-documents?category=laws" },
                { label: "Приказы", href: "/normative-documents?category=orders" }
              ]}
            />

            <ModuleCard
              icon={Calculator}
              iconBg="bg-emerald-500/20"
              iconColor="text-emerald-400"
              title="Калькуляторы"
              description="Расчёты по НПА РК"
              primaryAction={{
                label: "Открыть модуль",
                href: "/calculators"
              }}
              secondaryActions={[
                { label: "Огнетушители", href: "/calculators/fire-extinguishers" },
                { label: "ПСС (НГПС)", href: "/calculators/ngps" },
                { label: "Категория помещения", href: "/calculators/explosion-category" }
              ]}
            />

            <ModuleCard
              icon={Bot}
              iconBg="bg-cyan-500/20"
              iconColor="text-cyan-400"
              title="АИ ассистент"
              description="Помощник по НПА и консультациям"
              primaryAction={{
                label: "Открыть модуль",
                href: "/ai-assistant"
              }}
              secondaryActions={[
                { label: "Новый чат", href: "/ai-assistant" }
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
              icon={Building}
              iconColor="text-accent"
              label="Объекты на учёте"
              value={renderMetricValue(metrics?.objects)}
              dataTestId="stat-objects"
            />
            <StatsCard
              icon={Users}
              iconColor="text-green-400"
              label="Пользователей в системе"
              value={renderMetricValue(metrics?.users)}
              dataTestId="stat-users"
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
