import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResidentialData {
  fires_total: number;
  fires_city: number;
  fires_rural: number;
  damage_total: number;
  damage_city: number;
  damage_rural: number;
  deaths_total: number;
  deaths_city: number;
  deaths_rural: number;
  deaths_children: number;
  injuries_total: number;
  injuries_city: number;
  injuries_rural: number;
  injuries_children: number;
  saved_people: number;
  saved_children: number;
  saved_property: number;
}

export default function Form5SPZHS() {
  const [reportData, setReportData] = useState<ResidentialData>({
    fires_total: 0,
    fires_city: 0,
    fires_rural: 0,
    damage_total: 0,
    damage_city: 0,
    damage_rural: 0,
    deaths_total: 0,
    deaths_city: 0,
    deaths_rural: 0,
    deaths_children: 0,
    injuries_total: 0,
    injuries_city: 0,
    injuries_rural: 0,
    injuries_children: 0,
    saved_people: 0,
    saved_children: 0,
    saved_property: 0
  });
  const [reportPeriod, setReportPeriod] = useState("");
  const { toast } = useToast();

  const handleInputChange = (field: keyof ResidentialData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setReportData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleExport = () => {
    const csvHeader = "Показатель,Всего,В городах,В сельской местности\n";
    const csvData = [
      `Количество пожаров,${reportData.fires_total},${reportData.fires_city},${reportData.fires_rural}`,
      `Сумма ущерба (тыс. тенге),${reportData.damage_total.toFixed(1)},${reportData.damage_city.toFixed(1)},${reportData.damage_rural.toFixed(1)}`,
      `Погибло людей всего,${reportData.deaths_total},${reportData.deaths_city},${reportData.deaths_rural}`,
      `из них детей,${reportData.deaths_children},,`,
      `Травмировано людей всего,${reportData.injuries_total},${reportData.injuries_city},${reportData.injuries_rural}`,
      `из них детей,${reportData.injuries_children},,`,
      `Спасено людей всего,${reportData.saved_people},,`,
      `из них детей,${reportData.saved_children},,`,
      `Спасено материальных ценностей (тыс. тенге),${reportData.saved_property.toFixed(1)},,`
    ].join('\n');
    
    const csvContent = csvHeader + csvData;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_5_spzhs_${reportPeriod || 'report'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Экспорт завершен",
      description: "Форма 5-СПЖС экспортирована в CSV"
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

    console.log("Отправка формы 5-СПЖС:", { reportPeriod, data: reportData });
    
    toast({
      title: "Форма отправлена",
      description: "Форма 5-СПЖС успешно отправлена в КПС МЧС РК"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Форма 5-СПЖС: Сведения о пожарах в жилом секторе и их последствиях
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Индекс: 5-СПЖС | Периодичность: ежемесячная | Срок: до 27 числа отчетного месяца
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
                Всего пожаров в жилом секторе: <span className="font-bold text-foreground">{reportData.fires_total}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-secondary">
                  <th className="border border-border p-2 text-left">Наименование показателей</th>
                  <th className="border border-border p-2 text-center">всего</th>
                  <th className="border border-border p-2 text-center">в городах</th>
                  <th className="border border-border p-2 text-center">в сельской местности</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-secondary/30">
                  <td className="border border-border p-2 font-medium">1. Количество пожаров</td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.fires_total || ''}
                      onChange={(e) => handleInputChange('fires_total', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.fires_city || ''}
                      onChange={(e) => handleInputChange('fires_city', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.fires_rural || ''}
                      onChange={(e) => handleInputChange('fires_rural', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                </tr>
                
                <tr className="hover:bg-secondary/30">
                  <td className="border border-border p-2 font-medium">2. Сумма ущерба (тысяч тенге)</td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={reportData.damage_total || ''}
                      onChange={(e) => handleInputChange('damage_total', e.target.value)}
                      className="text-center"
                      placeholder="0.0"
                    />
                  </td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={reportData.damage_city || ''}
                      onChange={(e) => handleInputChange('damage_city', e.target.value)}
                      className="text-center"
                      placeholder="0.0"
                    />
                  </td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={reportData.damage_rural || ''}
                      onChange={(e) => handleInputChange('damage_rural', e.target.value)}
                      className="text-center"
                      placeholder="0.0"
                    />
                  </td>
                </tr>

                <tr className="hover:bg-secondary/30 bg-red-50 dark:bg-red-900/20">
                  <td className="border border-border p-2 font-medium">3. Погибло людей на пожарах (всего)</td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.deaths_total || ''}
                      onChange={(e) => handleInputChange('deaths_total', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.deaths_city || ''}
                      onChange={(e) => handleInputChange('deaths_city', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.deaths_rural || ''}
                      onChange={(e) => handleInputChange('deaths_rural', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                </tr>

                <tr className="hover:bg-secondary/30 bg-red-50 dark:bg-red-900/20">
                  <td className="border border-border p-2 font-medium pl-8">1) детей</td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.deaths_children || ''}
                      onChange={(e) => handleInputChange('deaths_children', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-2 text-center text-muted-foreground">-</td>
                  <td className="border border-border p-2 text-center text-muted-foreground">-</td>
                </tr>

                <tr className="hover:bg-secondary/30 bg-orange-50 dark:bg-orange-900/20">
                  <td className="border border-border p-2 font-medium">4. Травмировано людей на пожарах (всего)</td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.injuries_total || ''}
                      onChange={(e) => handleInputChange('injuries_total', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.injuries_city || ''}
                      onChange={(e) => handleInputChange('injuries_city', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.injuries_rural || ''}
                      onChange={(e) => handleInputChange('injuries_rural', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                </tr>

                <tr className="hover:bg-secondary/30 bg-orange-50 dark:bg-orange-900/20">
                  <td className="border border-border p-2 font-medium pl-8">1) детей</td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.injuries_children || ''}
                      onChange={(e) => handleInputChange('injuries_children', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-2 text-center text-muted-foreground">-</td>
                  <td className="border border-border p-2 text-center text-muted-foreground">-</td>
                </tr>

                <tr className="hover:bg-secondary/30 bg-green-50 dark:bg-green-900/20">
                  <td className="border border-border p-2 font-medium">5. Спасено людей на пожарах (всего)</td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.saved_people || ''}
                      onChange={(e) => handleInputChange('saved_people', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-2 text-center text-muted-foreground">-</td>
                  <td className="border border-border p-2 text-center text-muted-foreground">-</td>
                </tr>

                <tr className="hover:bg-secondary/30 bg-green-50 dark:bg-green-900/20">
                  <td className="border border-border p-2 font-medium pl-8">1) детей</td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      value={reportData.saved_children || ''}
                      onChange={(e) => handleInputChange('saved_children', e.target.value)}
                      className="text-center"
                      placeholder="0"
                    />
                  </td>
                  <td className="border border-border p-2 text-center text-muted-foreground">-</td>
                  <td className="border border-border p-2 text-center text-muted-foreground">-</td>
                </tr>

                <tr className="hover:bg-secondary/30 bg-blue-50 dark:bg-blue-900/20">
                  <td className="border border-border p-2 font-medium">6. Спасено материальных ценностей (тысяч тенге)</td>
                  <td className="border border-border p-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={reportData.saved_property || ''}
                      onChange={(e) => handleInputChange('saved_property', e.target.value)}
                      className="text-center"
                      placeholder="0.0"
                    />
                  </td>
                  <td className="border border-border p-2 text-center text-muted-foreground">-</td>
                  <td className="border border-border p-2 text-center text-muted-foreground">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Сводка по жилому сектору</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Всего пожаров:</span>
                  <span className="ml-2 font-semibold text-foreground">{reportData.fires_total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Общий ущерб:</span>
                  <span className="ml-2 font-semibold text-foreground">{reportData.damage_total.toFixed(1)} тыс. тг</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Погибло:</span>
                  <span className="ml-2 font-semibold text-destructive">{reportData.deaths_total} чел.</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Спасено:</span>
                  <span className="ml-2 font-semibold text-green-600">{reportData.saved_people} чел.</span>
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