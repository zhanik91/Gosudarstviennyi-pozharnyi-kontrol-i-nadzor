import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIRE_OBJECTS, FORM_4_OBJECT_ROWS, flattenFormRows } from "@/data/fire-forms-data";
import { Download, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ObjectData {
  fires_total: number;
  fires_high_risk: number;
  damage_total: number;
  damage_high_risk: number;
}

export default function Form4SOVP() {
  const [reportData, setReportData] = useState<Record<string, ObjectData>>({});
  const [reportPeriod, setReportPeriod] = useState("");
  const { toast } = useToast();

  const handleInputChange = (objectCode: string, field: keyof ObjectData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setReportData(prev => ({
      ...prev,
      [objectCode]: {
        ...prev[objectCode],
        [field]: numValue
      }
    }));
  };

  const getObjectData = (objectCode: string): ObjectData => {
    return reportData[objectCode] || {
      fires_total: 0,
      fires_high_risk: 0,
      damage_total: 0,
      damage_high_risk: 0,
    };
  };

  const getTotals = () => {
    const totals = {
      fires_total: 0,
      fires_high_risk: 0,
      damage_total: 0,
      damage_high_risk: 0,
    };

    Object.values(reportData).forEach(data => {
      totals.fires_total += data.fires_total;
      totals.fires_high_risk += data.fires_high_risk;
      totals.damage_total += data.damage_total;
      totals.damage_high_risk += data.damage_high_risk;
    });

    return totals;
  };

  const handleExport = () => {
    const csvHeader = "Объекты возникновения пожаров,Количество пожаров всего,в том числе на объектах высокой степени риска,Ущерб всего (тыс. тенге),в том числе на объектах высокой степени риска\n";
    
    const csvData = FIRE_OBJECTS.map(obj => {
      const data = getObjectData(obj.code);
      return `"${obj.name}",${data.fires_total},${data.fires_high_risk},${data.damage_total.toFixed(1)},${data.damage_high_risk.toFixed(1)}`;
    }).join('\n');
    
    const totals = getTotals();
    const totalRow = `\nИТОГО:,${totals.fires_total},${totals.fires_high_risk},${totals.damage_total.toFixed(1)},${totals.damage_high_risk.toFixed(1)}`;
    
    const csvContent = csvHeader + csvData + totalRow;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_4_sovp_${reportPeriod || 'report'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Экспорт завершен",
      description: "Форма 4-СОВП экспортирована в CSV"
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

    console.log("Отправка формы 4-СОВП:", { reportPeriod, data: reportData });
    
    toast({
      title: "Форма отправлена",
      description: "Форма 4-СОВП успешно отправлена в КПС МЧС РК"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Форма 4-СОВП: Сведения об объектах возникновения пожаров
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Индекс: 4-СОВП | Периодичность: ежемесячная | Срок: до 27 числа отчетного месяца
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
                Всего пожаров: <span className="font-bold text-foreground">{getTotals().fires_total}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-secondary">
                  <th className="border border-border p-2 text-left">Объекты возникновения пожаров</th>
                  <th className="border border-border p-2 text-center">Количество пожаров всего</th>
                  <th className="border border-border p-2 text-center">в т.ч. на объектах высокой степени риска</th>
                  <th className="border border-border p-2 text-center">Ущерб всего (тыс. тг)</th>
                  <th className="border border-border p-2 text-center">в т.ч. на объектах высокой степени риска</th>
                </tr>
              </thead>
              <tbody>
                {flattenFormRows(FORM_4_OBJECT_ROWS).map((obj) => {
                  const data = getObjectData(obj.id);
                  return (
                    <tr key={obj.id} className="hover:bg-secondary/30">
                      <td className="border border-border p-2 font-medium">
                        <div
                          className="flex items-start gap-2"
                          style={{ paddingLeft: `${obj.depth * 16}px` }}
                        >
                          <span className="text-xs text-muted-foreground">{obj.number}</span>
                          <span>{obj.label}</span>
                        </div>
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          value={data.fires_total || ''}
                          onChange={(e) => handleInputChange(obj.id, 'fires_total', e.target.value)}
                          className="text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          value={data.fires_high_risk || ''}
                          onChange={(e) => handleInputChange(obj.id, 'fires_high_risk', e.target.value)}
                          className="text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={data.damage_total || ''}
                          onChange={(e) => handleInputChange(obj.id, 'damage_total', e.target.value)}
                          className="text-center"
                          placeholder="0.0"
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={data.damage_high_risk || ''}
                          onChange={(e) => handleInputChange(obj.id, 'damage_high_risk', e.target.value)}
                          className="text-center"
                          placeholder="0.0"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Card className="bg-yellow-100 dark:bg-yellow-900/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4 text-center font-bold">
                <div>
                  <div className="text-sm text-muted-foreground">Всего пожаров</div>
                  <div className="text-xl">{getTotals().fires_total}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">На объектах высокой степени риска</div>
                  <div className="text-xl">{getTotals().fires_high_risk}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Общий ущерб</div>
                  <div className="text-xl">{getTotals().damage_total.toFixed(1)} тыс. тг</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Ущерб (высокий риск)</div>
                  <div className="text-xl">{getTotals().damage_high_risk.toFixed(1)} тыс. тг</div>
                </div>
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
