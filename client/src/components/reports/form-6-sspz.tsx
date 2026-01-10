import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { STEPPE_FIRE_TYPES } from "@/data/fire-forms-data";
import { Download, FileText, Send, Flame } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SteppeFireData {
  count: number;
  area_hectares: number;
  damage: number;
  cause: string;
}

export default function Form6SSPZ() {
  const [reportData, setReportData] = useState<Record<string, SteppeFireData>>({});
  const [reportPeriod, setReportPeriod] = useState("");
  const { toast } = useToast();

  const handleInputChange = (typeCode: string, field: keyof SteppeFireData, value: string) => {
    const numValue = field === 'cause' ? value : (parseFloat(value) || 0);
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
      damage: 0,
      cause: ''
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
    const csvHeader = "Тип пожара,Количество,Площадь (га),Ущерб (тыс. тенге),Основная причина\n";
    
    const csvData = STEPPE_FIRE_TYPES.map(type => {
      const data = getFireData(type.code);
      return `"${type.name}",${data.count},${data.area_hectares.toFixed(1)},${data.damage.toFixed(1)},"${data.cause}"`;
    }).join('\n');
    
    const totals = getTotals();
    const totalRow = `\nИТОГО:,${totals.count},${totals.area_hectares.toFixed(1)},${totals.damage.toFixed(1)},`;
    
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

          <div className="grid gap-4">
            {STEPPE_FIRE_TYPES.map((type) => {
              const data = getFireData(type.code);
              return (
                <Card key={type.code} className="bg-secondary/50">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-center">
                      <div className="lg:col-span-2">
                        <h4 className="font-medium text-sm">
                          {type.code}. {type.name}
                        </h4>
                        <div className="text-xs text-muted-foreground mt-1">
                          Тип территории: {type.area_type}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor={`count-${type.code}`} className="text-xs">
                          Количество
                        </Label>
                        <Input
                          id={`count-${type.code}`}
                          type="number"
                          min="0"
                          value={data.count || ''}
                          onChange={(e) => handleInputChange(type.code, 'count', e.target.value)}
                          placeholder="0"
                          className="text-center"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`area-${type.code}`} className="text-xs">
                          Площадь (га)
                        </Label>
                        <Input
                          id={`area-${type.code}`}
                          type="number"
                          min="0"
                          step="0.1"
                          value={data.area_hectares || ''}
                          onChange={(e) => handleInputChange(type.code, 'area_hectares', e.target.value)}
                          placeholder="0.0"
                          className="text-center"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`damage-${type.code}`} className="text-xs">
                          Ущерб (тыс. тг)
                        </Label>
                        <Input
                          id={`damage-${type.code}`}
                          type="number"
                          min="0"
                          step="0.1"
                          value={data.damage || ''}
                          onChange={(e) => handleInputChange(type.code, 'damage', e.target.value)}
                          placeholder="0.0"
                          className="text-center"
                        />
                      </div>

                      <div>
                        <Label htmlFor={`cause-${type.code}`} className="text-xs">
                          Основная причина
                        </Label>
                        <Input
                          id={`cause-${type.code}`}
                          type="text"
                          value={data.cause || ''}
                          onChange={(e) => handleInputChange(type.code, 'cause', e.target.value)}
                          placeholder="Укажите причину"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
              <h4 className="font-semibold mb-2">Меры профилактики</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Контроль сжигания растительных остатков</p>
                <p>• Создание противопожарных полос</p>
                <p>• Мониторинг погодных условий</p>
                <p>• Информирование населения о запрете разведения костров</p>
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