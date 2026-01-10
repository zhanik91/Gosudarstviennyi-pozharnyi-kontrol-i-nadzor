import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CO_POISONING_CAUSES } from "@/data/fire-forms-data";
import { Download, FileText, Send, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface COPoisoningData {
  deaths_total: number;
  deaths_city: number;
  deaths_rural: number;
  deaths_children: number;
  injuries_total: number;
  injuries_city: number;
  injuries_rural: number;
  injuries_children: number;
  causes: Record<string, number>;
  description: string;
}

export default function FormCO() {
  const [reportData, setReportData] = useState<COPoisoningData>({
    deaths_total: 0,
    deaths_city: 0,
    deaths_rural: 0,
    deaths_children: 0,
    injuries_total: 0,
    injuries_city: 0,
    injuries_rural: 0,
    injuries_children: 0,
    causes: {},
    description: ''
  });
  const [reportPeriod, setReportPeriod] = useState("");
  const { toast } = useToast();

  const handleInputChange = (field: keyof Omit<COPoisoningData, 'causes'>, value: string) => {
    if (field === 'description') {
      setReportData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      const numValue = parseFloat(value) || 0;
      setReportData(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  const handleCauseChange = (causeCode: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setReportData(prev => ({
      ...prev,
      causes: {
        ...prev.causes,
        [causeCode]: numValue
      }
    }));
  };

  const getTotalCauses = () => {
    return Object.values(reportData.causes).reduce((sum, value) => sum + value, 0);
  };

  const handleExport = () => {
    const csvHeader = "Показатель,Всего,В городах,В сельской местности\n";
    const csvData = [
      `Погибло людей от отравления угарным газом,${reportData.deaths_total},${reportData.deaths_city},${reportData.deaths_rural}`,
      `из них детей,${reportData.deaths_children},,`,
      `Травмировано людей от отравления угарным газом,${reportData.injuries_total},${reportData.injuries_city},${reportData.injuries_rural}`,
      `из них детей,${reportData.injuries_children},,`
    ].join('\n');
    
    const causesData = '\n\nПричины отравления угарным газом,Количество случаев\n' + 
      CO_POISONING_CAUSES.map(cause => 
        `"${cause.name}",${reportData.causes[cause.code] || 0}`
      ).join('\n');
    
    const csvContent = csvHeader + csvData + causesData + 
      `\n\nИТОГО случаев по причинам:,${getTotalCauses()}` +
      `\n\nОписание обстоятельств:,"${reportData.description}"`;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_co_${reportPeriod || 'report'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Экспорт завершен",
      description: "Форма CO экспортирована в CSV"
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

    console.log("Отправка формы CO:", { reportPeriod, data: reportData });
    
    toast({
      title: "Форма отправлена",
      description: "Форма CO успешно отправлена в КПС МЧС РК"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Форма CO: Сведения о погибших и травмированных от отравления угарным газом
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Индекс: CO | Периодичность: ежемесячная | Срок: до 27 числа отчетного месяца
          </div>
          <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
            ⚠️ Случаи в результате нарушений требований пожарной безопасности, не повлекших возникновения пожара
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
                Всего погибших: <span className="font-bold text-destructive">{reportData.deaths_total}</span>
              </div>
            </div>
          </div>

          <Card className="bg-red-50 dark:bg-red-900/20">
            <CardHeader>
              <CardTitle className="text-lg text-red-700 dark:text-red-300">
                Статистика пострадавших
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="border border-border p-2 text-left">Показатель</th>
                      <th className="border border-border p-2 text-center">всего</th>
                      <th className="border border-border p-2 text-center">в городах</th>
                      <th className="border border-border p-2 text-center">в сельской местности</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-secondary/30">
                      <td className="border border-border p-2 font-medium">Погибло людей от отравления угарным газом</td>
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
                    
                    <tr className="hover:bg-secondary/30">
                      <td className="border border-border p-2 font-medium pl-8">из них детей</td>
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
                      <td className="border border-border p-2 font-medium">Травмировано людей от отравления угарным газом</td>
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
                      <td className="border border-border p-2 font-medium pl-8">из них детей</td>
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
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30">
            <CardHeader>
              <CardTitle className="text-lg">Причины отравления угарным газом</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {CO_POISONING_CAUSES.map((cause) => (
                  <div key={cause.code} className="flex items-center gap-4 p-3 bg-background rounded border">
                    <div className="flex-1">
                      <span className="font-medium">{cause.code}. {cause.name}</span>
                    </div>
                    <div className="w-20">
                      <Input
                        type="number"
                        min="0"
                        value={reportData.causes[cause.code] || ''}
                        onChange={(e) => handleCauseChange(cause.code, e.target.value)}
                        placeholder="0"
                        className="text-center"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded">
                <div className="font-semibold">
                  Всего случаев по причинам: {getTotalCauses()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Описание обстоятельств</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="description">
                Подробное описание обстоятельств происшествий и принятых мер
              </Label>
              <Textarea
                id="description"
                value={reportData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Укажите обстоятельства каждого случая отравления угарным газом, принятые меры профилактики..."
                className="mt-2 min-h-[120px]"
              />
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Итоговая статистика
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{reportData.deaths_total}</div>
                  <div className="text-muted-foreground">Погибло всего</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{reportData.deaths_children}</div>
                  <div className="text-muted-foreground">Детей погибло</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{reportData.injuries_total}</div>
                  <div className="text-muted-foreground">Травмировано всего</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{reportData.injuries_children}</div>
                  <div className="text-muted-foreground">Детей травмировано</div>
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