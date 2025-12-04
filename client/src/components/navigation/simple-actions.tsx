
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileCheck, Building } from "lucide-react";
import { Link } from "wouter";

export function SimpleActions() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Журнал заключений аудитов */}
      <Card className="bg-slate-900/40 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-600/10 p-3">
              <FileCheck className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Журнал заключений аудитов
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Учет заключений аудитов в области пожарной безопасности, 
                импорт/экспорт данных, контроль сроков освобождения
              </p>
              <Link href="/audit-conclusions-journal">
                <Button className="w-full bg-blue-600 hover:bg-blue-500">
                  Открыть журнал
                </Button>
              </Link>
              <div className="flex gap-2 mt-3">
                <Link href="/audit-conclusions-journal">
                  <Button variant="outline" size="sm" className="flex-1">
                    Журнал
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Перечень подконтрольных объектов */}
      <Card className="bg-slate-900/40 border-slate-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-emerald-600/10 p-3">
              <Building className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">
                Подконтрольные объекты
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Реестр объектов контроля, управление данными, 
                мониторинг статусов соответствия
              </p>
              <Link href="/controlled-objects">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500">
                  Открыть реестр
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
