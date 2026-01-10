import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FIRE_CAUSES, flattenFormRows } from "@/data/fire-forms-data";
import { Download, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CauseData {
  fires_total: number;
  fires_high_risk: number;
  damage_total: number;
  damage_high_risk: number;
}

export default function Form3SPVP() {
  const [reportData, setReportData] = useState<Record<string, CauseData>>({});
  const [reportPeriod, setReportPeriod] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const flattenedRows = flattenFormRows(FIRE_CAUSES);

  const handleInputChange = (causeCode: string, field: keyof CauseData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setReportData(prev => ({
      ...prev,
      [causeCode]: {
        ...prev[causeCode],
        [field]: numValue
      }
    }));
  };

  const getCauseData = (causeCode: string): CauseData => {
    return reportData[causeCode] || {
      fires_total: 0,
      fires_high_risk: 0,
      damage_total: 0,
      damage_high_risk: 0
    };
  };

  const getTotals = () => {
    const totals = {
      fires_total: 0,
      fires_high_risk: 0,
      damage_total: 0,
      damage_high_risk: 0
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
    const csvHeader = "Причины возникновения пожаров,Количество пожаров всего,в том числе на объектах высокой степени риска,Ущерб всего (тыс. тенге),в том числе на объектах высокой степени риска\n";
    
    const csvData = flattenedRows.map((cause) => {
      const data = getCauseData(cause.id);
      return `"${cause.label}",${data.fires_total},${data.fires_high_risk},${data.damage_total.toFixed(1)},${data.damage_high_risk.toFixed(1)}`;
    }).join('\n');
    
    const totals = getTotals();
    const totalRow = `\nИТОГО:,${totals.fires_total},${totals.fires_high_risk},${totals.damage_total.toFixed(1)},${totals.damage_high_risk.toFixed(1)}`;
    
    const notesSection = [
      "",
      "Дополнительные сведения по пунктам 16-17",
      `16,"${additionalNotes["16"] || ""}"`,
      `17,"${additionalNotes["17"] || ""}"`,
    ].join("\n");
    const csvContent = csvHeader + csvData + totalRow + notesSection;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_3_spvp_${reportPeriod || 'report'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Экспорт завершен",
      description: "Форма 3-СПВП экспортирована в CSV"
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

    console.log("Отправка формы 3-СПВП:", { reportPeriod, data: reportData });
    
    toast({
      title: "Форма отправлена",
      description: "Форма 3-СПВП успешно отправлена в КПС МЧС РК"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Форма 3-СПВП: Сведения о причинах возникновения пожаров
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Индекс: 3-СПВП | Периодичность: ежемесячная | Срок: до 27 числа отчетного месяца
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
                  <th className="border border-border p-2 text-left">Причины возникновения пожаров</th>
                  <th className="border border-border p-2 text-center" colSpan={2}>Количество пожаров</th>
                  <th className="border border-border p-2 text-center" colSpan={2}>Ущерб (тыс. тенге)</th>
                </tr>
                <tr className="bg-secondary/50">
                  <th className="border border-border p-2"></th>
                  <th className="border border-border p-2 text-center">всего</th>
                  <th className="border border-border p-2 text-center">в т.ч. на объектах высокой степени риска</th>
                  <th className="border border-border p-2 text-center">всего</th>
                  <th className="border border-border p-2 text-center">в т.ч. на объектах высокой степени риска</th>
                </tr>
              </thead>
              <tbody>
                {flattenedRows.map((cause) => {
                  const data = getCauseData(cause.id);
                  return (
                    <tr key={cause.id} className="hover:bg-secondary/30">
                      <td className="border border-border p-2 font-medium">
                        <div
                          className="flex items-start gap-2"
                          style={{ paddingLeft: `${cause.depth * 16}px` }}
                        >
                          <span className="text-xs text-muted-foreground">{cause.number}</span>
                          <span>{cause.label}</span>
                        </div>
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          value={data.fires_total || ''}
                          onChange={(e) => handleInputChange(cause.id, 'fires_total', e.target.value)}
                          className="text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          value={data.fires_high_risk || ''}
                          onChange={(e) => handleInputChange(cause.id, 'fires_high_risk', e.target.value)}
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
                          onChange={(e) => handleInputChange(cause.id, 'damage_total', e.target.value)}
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
                          onChange={(e) => handleInputChange(cause.id, 'damage_high_risk', e.target.value)}
                          className="text-center"
                          placeholder="0.0"
                        />
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-yellow-100 dark:bg-yellow-900/20 font-bold">
                  <td className="border border-border p-2">ИТОГО:</td>
                  <td className="border border-border p-2 text-center">{getTotals().fires_total}</td>
                  <td className="border border-border p-2 text-center">{getTotals().fires_high_risk}</td>
                  <td className="border border-border p-2 text-center">{getTotals().damage_total.toFixed(1)}</td>
                  <td className="border border-border p-2 text-center">{getTotals().damage_high_risk.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-base">Пояснения по пунктам 16–17</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="note-16">16. Неустановленные причины (расписать каждый пожар)</Label>
                <Textarea
                  id="note-16"
                  value={additionalNotes["16"] || ""}
                  onChange={(e) => setAdditionalNotes((prev) => ({ ...prev, ["16"]: e.target.value }))}
                  placeholder="Опишите каждый случай с неустановленной причиной"
                  className="mt-2 min-h-[90px]"
                />
              </div>
              <div>
                <Label htmlFor="note-17">17. Другие причины возникновения пожаров (расписать)</Label>
                <Textarea
                  id="note-17"
                  value={additionalNotes["17"] || ""}
                  onChange={(e) => setAdditionalNotes((prev) => ({ ...prev, ["17"]: e.target.value }))}
                  placeholder="Опишите каждую прочую причину"
                  className="mt-2 min-h-[90px]"
                />
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
