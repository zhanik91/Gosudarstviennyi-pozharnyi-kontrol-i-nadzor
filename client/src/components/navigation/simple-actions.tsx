import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, FileText } from "lucide-react";
import { Link } from "wouter";

export function SimpleActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* Новое происшествие */}
      <Card className="p-6 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
        <Link href="/incidents/new">
          <Button 
            size="lg" 
            className="w-full h-24 flex-col gap-3 bg-orange-600 hover:bg-orange-700 text-white"
            data-testid="button-new-incident"
          >
            <Plus className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold text-lg">Новое происшествие</div>
              <div className="text-sm opacity-90">Добавить в журнал выездов</div>
            </div>
          </Button>
        </Link>
      </Card>

      {/* Отчеты */}
      <Card className="p-6 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        <Link href="/reports">
          <Button 
            variant="outline"
            size="lg" 
            className="w-full h-24 flex-col gap-3 border-2 border-blue-200 hover:border-blue-300 text-blue-700 hover:bg-blue-50"
            data-testid="button-reports"
          >
            <FileText className="h-8 w-8" />
            <div className="text-center">
              <div className="font-semibold text-lg">Отчеты МЧС</div>
              <div className="text-sm opacity-75">1-ОСП, 2-ССГ, пакеты</div>
            </div>
          </Button>
        </Link>
      </Card>
    </div>
  );
}