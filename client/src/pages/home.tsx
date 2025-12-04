import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import ModuleCard from "@/components/portal/module-card";
import StatsCard from "@/components/portal/stats-card";
import { SimpleActions } from "@/components/navigation/simple-actions";
import { Shield, Building, FileText, Activity, Package, Users, FileCheck, Bell, Smartphone, Map } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground portal-bg">
      <Header />

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Простые действия */}
        <SimpleActions />
        <div className="space-y-8 fade-in">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Добро пожаловать в портал</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Единая цифровая платформа пожарной безопасности для мониторинга, государственного контроля и формирование отчетности КПС МЧС РК
            </p>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModuleCard
              icon={Shield}
              iconBg="bg-primary/20"
              iconColor="text-primary"
              title="Государственный учёт пожаров"
              description="Журнал выездов, единое окно ввода, отчёты 1-ОСП, 2-ССГ, 3-СПВП, 4-СОВП, 5-СПЖС, 6-ССПЗ и CO, пакеты и диаграммы"
              primaryAction={{
                label: "Открыть модуль",
                href: "/fire-module"
              }}
              secondaryActions={[
                { label: "Отчёты", href: "/fire-module?tab=reports" },
                { label: "Журнал", href: "/fire-module?tab=journal" }
              ]}
            />

            <ModuleCard
              icon={Building}
              iconBg="bg-accent/20"
              iconColor="text-accent"
              title="Государственный контроль и надзор"
              description="Реестр подконтрольных объектов (ОВСР/иные), атрибуты, статусы проверок, привязка к территориям"
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
              title="CRM и Документооборот"
              description="Управление документами, облачное хранилище, автоматическая генерация PDF отчетов, версионирование"
              primaryAction={{
                label: "Открыть CRM",
                href: "/document-management"
              }}
              secondaryActions={[
                { label: "Документы", href: "/document-management" },
                { label: "Аналитика", href: "/crm" }
              ]}
            />

            <ModuleCard
              icon={Bell}
              iconBg="bg-purple-500/20" 
              iconColor="text-purple-400"
              title="Уведомления и Workflow"
              description="Email уведомления, система многоуровневых согласований, календарь событий, автоматические оповещения"
              primaryAction={{
                label: "Открыть систему",
                href: "/notifications"
              }}
              secondaryActions={[
                { label: "Уведомления", href: "/notifications" },
                { label: "Согласования", href: "/notifications" }
              ]}
            />

            <ModuleCard
              icon={Map}
              iconBg="bg-blue-500/20"
              iconColor="text-blue-400"
              title="Интерактивные карты"
              description="Геоинформационная система, визуализация происшествий по регионам, прогнозирование рисков"
              primaryAction={{
                label: "Открыть карты",
                href: "/maps"
              }}
              secondaryActions={[
                { label: "Карта рисков", href: "/maps" },
                { label: "Прогнозы", href: "/maps" }
              ]}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={Activity}
              iconColor="text-primary"
              label="Инциденты за месяц"
              value="—"
              dataTestId="stat-incidents"
            />
            <StatsCard
              icon={Package}
              iconColor="text-accent"
              label="Активные пакеты"
              value="—"
              dataTestId="stat-packages"
            />
            <StatsCard
              icon={Users}
              iconColor="text-green-400"
              label="Пользователи онлайн"
              value="—"
              dataTestId="stat-users"
            />
            <StatsCard
              icon={FileCheck}
              iconColor="text-blue-400"
              label="Отчёты готовы"
              value="—"
              dataTestId="stat-reports"
            />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}