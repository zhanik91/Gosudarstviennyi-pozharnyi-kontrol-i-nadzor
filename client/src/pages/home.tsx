import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/layout/footer";
import ModuleCard from "@/components/portal/module-card";
import StatsCard from "@/components/portal/stats-card";
import { SimpleActions } from "@/components/navigation/simple-actions";
import { Shield, Building, Activity, Users, FileCheck, Scale, BookOpen, Calculator, Bot, ClipboardCheck, FileWarning } from "lucide-react";
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
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Модули системы</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <ModuleCard
                icon={Shield}
                iconBg="bg-primary/20"
                iconColor="text-primary"
                title="Государственный учёт пожаров"
                description="Регистрация пожаров, автозаполнение форм 1-7, интерактивная аналитика"
                primaryAction={{
                  label: "Открыть модуль",
                  href: "/fire-module"
                }}
              />

              <ModuleCard
                icon={Building}
                iconBg="bg-accent/20"
                iconColor="text-accent"
                title="Государственный контроль и надзор"
                description="Реестр объектов, проверки, МОР с контролем сроков, талоны"
                primaryAction={{
                  label: "Открыть модуль",
                  href: "/controlled-objects"
                }}
              />

              <ModuleCard
                icon={FileCheck}
                iconBg="bg-orange-500/20"
                iconColor="text-orange-400"
                title="Журналы и списки"
                description="Ведомственные и объектовые журналы, учёт ППС и инструктажей"
                primaryAction={{
                  label: "Открыть модуль",
                  href: "/journals-lists",
                }}
              />

              <ModuleCard
                icon={Scale}
                iconBg="bg-purple-500/20"
                iconColor="text-purple-400"
                title="Административная практика"
                description="Регистрация админ. дел, протоколы, постановления, фотофиксация"
                primaryAction={{
                  label: "Открыть модуль",
                  href: "/admin-practices"
                }}
              />

              <ModuleCard
                icon={BookOpen}
                iconBg="bg-blue-500/20"
                iconColor="text-blue-400"
                title="Нормативные документы"
                description="Полная база НПА, законов, приказов и техрегламентов РК"
                primaryAction={{
                  label: "Открыть модуль",
                  href: "/normative-documents"
                }}
              />

              <ModuleCard
                icon={Calculator}
                iconBg="bg-emerald-500/20"
                iconColor="text-emerald-400"
                title="Калькуляторы"
                description="Расчёт огнетушителей, ПСС (НГПС), категорий взрывопожароопасности"
                primaryAction={{
                  label: "Открыть модуль",
                  href: "/calculators"
                }}
              />

              <ModuleCard
                icon={Bot}
                iconBg="bg-cyan-500/20"
                iconColor="text-cyan-400"
                title="АИ ассистент"
                description="Умный помощник с базой знаний НПА, консультации в реальном времени"
                primaryAction={{
                  label: "Открыть модуль",
                  href: "/ai-assistant"
                }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Статистика за месяц</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <StatsCard
                icon={Activity}
                iconColor="text-primary"
                label="Инциденты"
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
                icon={ClipboardCheck}
                iconColor="text-orange-400"
                label="Проверок проведено"
                value={renderMetricValue(metrics?.inspections)}
                dataTestId="stat-inspections"
              />
              <StatsCard
                icon={FileWarning}
                iconColor="text-purple-400"
                label="Адм. дел составлено"
                value={renderMetricValue(metrics?.adminCases)}
                dataTestId="stat-admin-cases"
              />
              <StatsCard
                icon={Users}
                iconColor="text-green-400"
                label="Пользователей"
                value={renderMetricValue(metrics?.users)}
                dataTestId="stat-users"
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
