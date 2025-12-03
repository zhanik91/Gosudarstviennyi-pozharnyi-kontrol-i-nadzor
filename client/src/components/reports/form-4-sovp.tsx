import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIRE_OBJECTS } from "@/data/fire-forms-data";
import { Download, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ObjectData {
  fires_total: number;
  damage_total: number;
  deaths_total: number;
  injuries_total: number;
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
      damage_total: 0,
      deaths_total: 0,
      injuries_total: 0
    };
  };

  const getTotals = () => {
    const totals = {
      fires_total: 0,
      damage_total: 0,
      deaths_total: 0,
      injuries_total: 0
    };

    Object.values(reportData).forEach(data => {
      totals.fires_total += data.fires_total;
      totals.damage_total += data.damage_total;
      totals.deaths_total += data.deaths_total;
      totals.injuries_total += data.injuries_total;
    });

    return totals;
  };

  const groupedObjects = FIRE_OBJECTS.reduce((acc, obj) => {
    if (!acc[obj.category]) {
      acc[obj.category] = [];
    }
    acc[obj.category].push(obj);
    return acc;
  }, {} as Record<string, typeof FIRE_OBJECTS>);

  const categoryNames = {
    residential: 'Жилые объекты',
    public: 'Общественные здания',
    commercial: 'Коммерческие объекты',
    industrial: 'Производственные объекты',
    storage: 'Складские помещения',
    agricultural: 'Сельскохозяйственные объекты',
    transport: 'Транспортные средства',
    natural: 'Природные территории',
    other: 'Прочие объекты'
  };

  const handleExport = () => {
    const csvHeader = "Объекты возникновения пожаров,Количество пожаров,Ущерб (тыс. тенге),Погибло людей,Травмировано людей\n";
    
    const csvData = FIRE_OBJECTS.map(obj => {
      const data = getObjectData(obj.code);
      return `"${obj.name}",${data.fires_total},${data.damage_total.toFixed(1)},${data.deaths_total},${data.injuries_total}`;
    }).join('\n');
    
    const totals = getTotals();
    const totalRow = `\nИТОГО:,${totals.fires_total},${totals.damage_total.toFixed(1)},${totals.deaths_total},${totals.injuries_total}`;
    
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

          <div className="space-y-6">
            {Object.entries(groupedObjects).map(([category, objects]) => (
              <Card key={category} className="bg-secondary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{categoryNames[category as keyof typeof categoryNames]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border">
                      <thead>
                        <tr className="bg-secondary">
                          <th className="border border-border p-2 text-left">Тип объекта</th>
                          <th className="border border-border p-2 text-center">Пожаров</th>
                          <th className="border border-border p-2 text-center">Ущерб (тыс. тг)</th>
                          <th className="border border-border p-2 text-center">Погибло</th>
                          <th className="border border-border p-2 text-center">Травмировано</th>
                        </tr>
                      </thead>
                      <tbody>
                        {objects.map((obj) => {
                          const data = getObjectData(obj.code);
                          return (
                            <tr key={obj.code} className="hover:bg-secondary/30">
                              <td className="border border-border p-2 font-medium">
                                {obj.name}
                              </td>
                              <td className="border border-border p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={data.fires_total || ''}
                                  onChange={(e) => handleInputChange(obj.code, 'fires_total', e.target.value)}
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
                                  onChange={(e) => handleInputChange(obj.code, 'damage_total', e.target.value)}
                                  className="text-center"
                                  placeholder="0.0"
                                />
                              </td>
                              <td className="border border-border p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={data.deaths_total || ''}
                                  onChange={(e) => handleInputChange(obj.code, 'deaths_total', e.target.value)}
                                  className="text-center"
                                  placeholder="0"
                                />
                              </td>
                              <td className="border border-border p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={data.injuries_total || ''}
                                  onChange={(e) => handleInputChange(obj.code, 'injuries_total', e.target.value)}
                                  className="text-center"
                                  placeholder="0"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-yellow-100 dark:bg-yellow-900/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4 text-center font-bold">
                <div>
                  <div className="text-sm text-muted-foreground">Всего пожаров</div>
                  <div className="text-xl">{getTotals().fires_total}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Общий ущерб</div>
                  <div className="text-xl">{getTotals().damage_total.toFixed(1)} тыс. тг</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Погибло</div>
                  <div className="text-xl text-destructive">{getTotals().deaths_total} чел.</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Травмировано</div>
                  <div className="text-xl text-orange-600">{getTotals().injuries_total} чел.</div>
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