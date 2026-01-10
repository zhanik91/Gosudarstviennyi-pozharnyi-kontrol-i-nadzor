import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FORM_7_CO_ROWS, flattenFormRows } from "@/data/fire-forms-data";
import { Download, FileText, Send, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface COPoisoningRowData {
  killed_total: number;
  injured_total: number;
}

export default function FormCO() {
  const [reportData, setReportData] = useState<Record<string, COPoisoningRowData>>({});
  const [reportPeriod, setReportPeriod] = useState("");
  const { toast } = useToast();

  const handleInputChange = (rowId: string, field: keyof COPoisoningRowData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setReportData((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [field]: numValue,
      },
    }));
  };

  const getRowData = (rowId: string): COPoisoningRowData =>
    reportData[rowId] || {
      killed_total: 0,
      injured_total: 0,
    };

  const getTotals = () =>
    Object.values(reportData).reduce(
      (acc, row) => ({
        killed_total: acc.killed_total + row.killed_total,
        injured_total: acc.injured_total + row.injured_total,
      }),
      { killed_total: 0, injured_total: 0 }
    );

  const handleExport = () => {
    const csvHeader = "Показатель,Погибло людей,Травмировано людей\n";
    const csvData = flattenFormRows(FORM_7_CO_ROWS)
      .map((row) => {
        const data = getRowData(row.id);
        return `"${row.label}",${data.killed_total},${data.injured_total}`;
      })
      .join("\n");

    const totals = getTotals();
    const totalRow = `\nИТОГО:,${totals.killed_total},${totals.injured_total}`;

    const csvContent = csvHeader + csvData + totalRow;

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `form_co_${reportPeriod || "report"}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Экспорт завершен",
      description: "Форма 7-CO экспортирована в CSV",
    });
  };

  const handleSubmit = () => {
    if (!reportPeriod) {
      toast({
        title: "Ошибка",
        description: "Укажите отчетный период",
        variant: "destructive",
      });
      return;
    }

    console.log("Отправка формы 7-CO:", { reportPeriod, data: reportData });

    toast({
      title: "Форма отправлена",
      description: "Форма 7-CO успешно отправлена в КПС МЧС РК",
    });
  };

  const totals = getTotals();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Форма 7-CO: Сведения о погибших и травмированных людях от отравления угарным газом
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Индекс: 7-CO | Периодичность: ежемесячная | Срок: до 27 числа отчетного месяца
          </div>
          <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
            ⚠️ Случаи в жилом секторе, не повлекшие возникновения пожара
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
                Всего погибших: <span className="font-bold text-destructive">{totals.killed_total}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-secondary">
                  <th className="border border-border p-2 text-left">Показатель</th>
                  <th className="border border-border p-2 text-center">Погибло людей</th>
                  <th className="border border-border p-2 text-center">Травмировано людей</th>
                </tr>
              </thead>
              <tbody>
                {flattenFormRows(FORM_7_CO_ROWS).map((row) => {
                  const data = getRowData(row.id);
                  return (
                    <tr key={row.id} className="hover:bg-secondary/30">
                      <td className="border border-border p-2 font-medium">
                        <div
                          className="flex items-start gap-2"
                          style={{ paddingLeft: `${row.depth * 16}px` }}
                        >
                          <span className="text-xs text-muted-foreground">{row.number}</span>
                          <span>{row.label}</span>
                        </div>
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          value={data.killed_total || ""}
                          onChange={(e) => handleInputChange(row.id, "killed_total", e.target.value)}
                          className="text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          value={data.injured_total || ""}
                          onChange={(e) => handleInputChange(row.id, "injured_total", e.target.value)}
                          className="text-center"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-yellow-100 dark:bg-yellow-900/20 font-bold">
                  <td className="border border-border p-2">ИТОГО:</td>
                  <td className="border border-border p-2 text-center">{totals.killed_total}</td>
                  <td className="border border-border p-2 text-center">{totals.injured_total}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Card className="bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Итоговая статистика
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{totals.killed_total}</div>
                  <div className="text-muted-foreground">Погибло всего</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{totals.injured_total}</div>
                  <div className="text-muted-foreground">Травмировано всего</div>
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
