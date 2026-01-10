import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FORM_6_SSPZ_ROWS, flattenFormRows } from "@/data/fire-forms-data";
import { Download, FileText, Send, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SteppeFireData {
  count: number;
  area_hectares: number;
  damage: number;
}

export default function Form6SSPZ() {
  const [reportData, setReportData] = useState<Record<string, SteppeFireData>>({});
  const [reportPeriod, setReportPeriod] = useState("");
  const { toast } = useToast();

  const handleInputChange = (typeCode: string, field: keyof SteppeFireData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setReportData(prev => ({
      ...prev,
      [typeCode]: {
        ...prev[typeCode],
        [field]: numValue
      }
    }));
  };

  const getFireData = (typeCode: string): SteppeFireData => {
    return reportData[typeCode] || {
      count: 0,
      area_hectares: 0,
      damage: 0
    };
  };

  const getTotals = () => {
    const totals = {
      count: 0,
      area_hectares: 0,
      damage: 0
    };

    Object.values(reportData).forEach(data => {
      totals.count += data.count;
      totals.area_hectares += data.area_hectares;
      totals.damage += data.damage;
    });

    return totals;
  };

  const handleExport = () => {
    const csvHeader = "Показатель,Количество,Площадь (га),Ущерб (тыс. тенге)\n";
    
    const csvData = flattenFormRows(FORM_6_SSPZ_ROWS).map(type => {
      const data = getFireData(type.id);
      return `"${type.label}",${data.count},${data.area_hectares.toFixed(1)},${data.damage.toFixed(1)}`;
    }).join('\n');
    
    const totals = getTotals();
    const totalRow = `\nИТОГО:,${totals.count},${totals.area_hectares.toFixed(1)},${totals.damage.toFixed(1)}`;
    
    const csvContent = csvHeader + csvData + totalRow;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_6_sspz_${reportPeriod || 'report'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Экспорт завершен",
      description: "Форма 6-ССПЗ экспортирована в CSV"
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

    console.log("Отправка формы 6-ССПЗ:", { reportPeriod, data: reportData });
    
    toast({
      title: "Форма отправлена",
      description: "Форма 6-ССПЗ успешно отправлена в КПС МЧС РК"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Форма 6-ССПЗ: Сведения о степных пожарах и загораниях
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Индекс: 6-ССПЗ | Периодичность: ежемесячная | Срок: до 27 числа отчетного месяца
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
                Всего степных пожаров: <span className="font-bold text-foreground">{getTotals().count}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-secondary">
                  <th className="border border-border p-2 text-left">Показатель</th>
                  <th className="border border-border p-2 text-center">Количество</th>
                  <th className="border border-border p-2 text-center">Площадь (га)</th>
                  <th className="border border-border p-2 text-center">Ущерб (тыс. тг)</th>
                </tr>
              </thead>
              <tbody>
                {flattenFormRows(FORM_6_SSPZ_ROWS).map((type) => {
                  const data = getFireData(type.id);
                  return (
                    <tr key={type.id} className="hover:bg-secondary/30">
                      <td className="border border-border p-2 font-medium">
                        <div
                          className="flex items-start gap-2"
                          style={{ paddingLeft: `${type.depth * 16}px` }}
                        >
                          <span className="text-xs text-muted-foreground">{type.number}</span>
                          <span>{type.label}</span>
                        </div>
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          value={data.count || ''}
                          onChange={(e) => handleInputChange(type.id, 'count', e.target.value)}
                          placeholder="0"
                          className="text-center"
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={data.area_hectares || ''}
                          onChange={(e) => handleInputChange(type.id, 'area_hectares', e.target.value)}
                          placeholder="0.0"
                          className="text-center"
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={data.damage || ''}
                          onChange={(e) => handleInputChange(type.id, 'damage', e.target.value)}
                          placeholder="0.0"
                          className="text-center"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Card className="bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Общая статистика степных пожаров
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{getTotals().count}</div>
                  <div className="text-muted-foreground">Всего пожаров</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{getTotals().area_hectares.toFixed(1)} га</div>
                  <div className="text-muted-foreground">Общая площадь</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{getTotals().damage.toFixed(1)} тыс. тг</div>
                  <div className="text-muted-foreground">Общий ущерб</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Памятка заполнения</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Количество указывается целыми числами.</p>
                <p>• Площадь и ущерб — в тысячах тенге с точностью до одного десятичного знака.</p>
                <p>• Итоговая строка 1 должна быть равна сумме подпунктов 1.1–1.4.</p>
              </div>
            </CardContent>
          </Card>

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
