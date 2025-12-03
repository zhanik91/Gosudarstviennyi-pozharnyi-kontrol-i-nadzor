import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NON_FIRE_CASES } from "@/data/fire-forms-data";
import { Download, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Form2SSG() {
  const [reportData, setReportData] = useState<Record<string, number>>({});
  const [reportPeriod, setReportPeriod] = useState("");
  const { toast } = useToast();

  const handleInputChange = (caseCode: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setReportData(prev => ({
      ...prev,
      [caseCode]: numValue
    }));
  };

  const getTotalCases = () => {
    return Object.values(reportData).reduce((sum, value) => sum + value, 0);
  };

  const handleExport = () => {
    const csvHeader = "№,Случаи горения не подлежащие учету как пожары,Количество\n";
    const csvData = NON_FIRE_CASES.map((case_, index) => {
      return `${index + 1},"${case_.name}",${reportData[case_.code] || 0}`;
    }).join('\n');
    
    const totalRow = `\nИТОГО:,${getTotalCases()}`;
    const csvContent = csvHeader + csvData + totalRow;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_2_ssg_${reportPeriod || 'report'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Экспорт завершен",
      description: "Форма 2-ССГ экспортирована в CSV"
    });
  };

  const handleSubmit = () => {
    if (!reportPeriod) {
      toast({
        title: "Ошибка",
        description: "Укажите отчетный период",
        variant: "destructive"
      });
      return;
    }

    // Здесь будет API вызов для отправки данных
    console.log("Отправка формы 2-ССГ:", { reportPeriod, data: reportData });
    
    toast({
      title: "Форма отправлена",
      description: "Форма 2-ССГ успешно отправлена в КПС МЧС РК"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Форма 2-ССГ: Сведения о случаях горения, не подлежащие учету как пожары
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Индекс: 2-ССГ | Периодичность: ежемесячная | Срок: до 27 числа отчетного месяца
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="period">Отчетный период</Label>
              <Input
                id="period"
                type="month"
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value)}
                placeholder="Выберите месяц и год"
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                Всего случаев: <span className="font-bold text-foreground">{getTotalCases()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Случаи горения по категориям</h3>
            
            <div className="grid gap-4">
              {NON_FIRE_CASES.map((case_, index) => (
                <Card key={case_.code} className="bg-secondary/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                      <div className="font-medium text-sm">
                        {index + 1}.
                      </div>
                      <div className="lg:col-span-2 text-sm">
                        {case_.name}
                      </div>
                      <div>
                        <Label htmlFor={`case-${case_.code}`} className="sr-only">
                          Количество случаев {index + 1}
                        </Label>
                        <Input
                          id={`case-${case_.code}`}
                          type="number"
                          min="0"
                          value={reportData[case_.code] || ''}
                          onChange={(e) => handleInputChange(case_.code, e.target.value)}
                          placeholder="0"
                          className="text-center"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Экспорт CSV
            </Button>
            <Button onClick={handleSubmit} className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Отправить в КПС МЧС РК
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}