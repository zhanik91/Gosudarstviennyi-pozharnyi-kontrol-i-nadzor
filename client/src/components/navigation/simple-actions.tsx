import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, FilePlus, Flame, Sparkles } from "lucide-react";
import { Link } from "wouter";

const actions = [
  {
    label: "Новое происшествие",
    description: "Быстро зафиксировать новое событие",
    href: "/fire-module/new",
    icon: Flame,
    accent: "from-amber-500/80 to-orange-500/60 text-amber-100"
  },
  {
    label: "Добавить документ",
    description: "Загрузить файл в CRM и задать статус",
    href: "/document-management/new",
    icon: FilePlus,
    accent: "from-blue-500/80 to-cyan-500/60 text-cyan-50"
  },
  {
    label: "Создать отчёт",
    description: "Формирование аналитики и выгрузка PDF",
    href: "/reports/create",
    icon: BarChart3,
    accent: "from-emerald-500/80 to-green-500/60 text-emerald-50"
  }
] as const;

export function SimpleActions() {
  return (
    <Card className="bg-gradient-to-br from-slate-950 via-slate-900/95 to-slate-900 border border-slate-800/70 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-800/70">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Быстрые действия
          </p>
          <h3 className="text-lg font-semibold text-white">Начните работу за пару кликов</h3>
          <p className="text-sm text-slate-400">Часто используемые операции портала</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-6">
        {actions.map(({ label, description, href, icon: Icon, accent }) => (
          <Button
            key={label}
            asChild
            variant="secondary"
            className="group relative w-full justify-start gap-3 overflow-hidden border border-slate-800/80 bg-white/5 text-left text-slate-100 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-700/70 hover:bg-white/10"
          >
            <Link to={href}>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${accent} shadow-inner`}
              >
                <Icon className="h-5 w-5 drop-shadow-sm" />
              </span>
              <span className="flex flex-col items-start">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-slate-400">{description}</span>
              </span>
            </Link>
          </Button>
        ))}
      </div>
    </Card>
  );
}
