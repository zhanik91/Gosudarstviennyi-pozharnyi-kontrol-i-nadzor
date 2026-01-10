import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, FileText, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FORM_5_SPZHS_ROWS, flattenFormRows } from "@/data/fire-forms-data";

interface ResidentialRowData {
  fires_total: number;
  killed_total: number;
  injured_total: number;
  rescued_total: number;
  damage_total: number;
}

export default function Form5SPZHS() {
  const [reportData, setReportData] = useState<Record<string, ResidentialRowData>>({});
  const [reportPeriod, setReportPeriod] = useState("");
  const { toast } = useToast();

  const handleInputChange = (rowId: string, field: keyof ResidentialRowData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setReportData((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [field]: numValue,
      },
    }));
  };

  const getRowData = (rowId: string): ResidentialRowData =>
    reportData[rowId] || {
      fires_total: 0,
      killed_total: 0,
      injured_total: 0,
      rescued_total: 0,
      damage_total: 0,
    };

  const getTotals = () => {
    return Object.values(reportData).reduce(
      (acc, row) => ({
        fires_total: acc.fires_total + row.fires_total,
        killed_total: acc.killed_total + row.killed_total,
        injured_total: acc.injured_total + row.injured_total,
        rescued_total: acc.rescued_total + row.rescued_total,
        damage_total: acc.damage_total + row.damage_total,
      }),
      { fires_total: 0, killed_total: 0, injured_total: 0, rescued_total: 0, damage_total: 0 }
    );
  };

  const handleExport = () => {
    const csvHeader = "Показатель,Количество пожаров,Погибло людей,Травмировано людей,Спасено людей,Ущерб (тыс. тенге)\n";
    const csvData = flattenFormRows(FORM_5_SPZHS_ROWS)
      .map((row) => {
        const data = getRowData(row.id);
        return `"${row.label}",${data.fires_total},${data.killed_total},${data.injured_total},${data.rescued_total},${data.damage_total.toFixed(1)}`;
      })
      .join("\n");

    const totals = getTotals();
    const totalRow = `\nИТОГО:,${totals.fires_total},${totals.killed_total},${totals.injured_total},${totals.rescued_total},${totals.damage_total.toFixed(1)}`;

    const csvContent = csvHeader + csvData + totalRow;

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `form_5_spzhs_${reportPeriod || "report"}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Экспорт завершен",
      description: "Форма 5-СПЖС экспортирована в CSV",
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

    console.log("Отправка формы 5-СПЖС:", { reportPeriod, data: reportData });

    toast({
      title: "Форма отправлена",
      description: "Форма 5-СПЖС успешно отправлена в КПС МЧС РК",
    });
  };

  const totals = getTotals();

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
                Всего пожаров в жилом секторе: <span className="font-bold text-foreground">{totals.fires_total}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-secondary">
                  <th className="border border-border p-2 text-left">Наименование показателей</th>
                  <th className="border border-border p-2 text-center">Количество пожаров</th>
                  <th className="border border-border p-2 text-center">Погибло людей</th>
                  <th className="border border-border p-2 text-center">Травмировано людей</th>
                  <th className="border border-border p-2 text-center">Спасено людей</th>
                  <th className="border border-border p-2 text-center">Ущерб (тыс. тенге)</th>
                </tr>
              </thead>
              <tbody>
                {flattenFormRows(FORM_5_SPZHS_ROWS).map((row) => {
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
                          value={data.fires_total || ""}
                          onChange={(e) => handleInputChange(row.id, "fires_total", e.target.value)}
                          className="text-center"
                          placeholder="0"
                        />
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
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          value={data.rescued_total || ""}
                          onChange={(e) => handleInputChange(row.id, "rescued_total", e.target.value)}
                          className="text-center"
                          placeholder="0"
                        />
                      </td>
                      <td className="border border-border p-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={data.damage_total || ""}
                          onChange={(e) => handleInputChange(row.id, "damage_total", e.target.value)}
                          className="text-center"
                          placeholder="0.0"
                        />
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-yellow-100 dark:bg-yellow-900/20 font-bold">
                  <td className="border border-border p-2">ИТОГО:</td>
                  <td className="border border-border p-2 text-center">{totals.fires_total}</td>
                  <td className="border border-border p-2 text-center">{totals.killed_total}</td>
                  <td className="border border-border p-2 text-center">{totals.injured_total}</td>
                  <td className="border border-border p-2 text-center">{totals.rescued_total}</td>
                  <td className="border border-border p-2 text-center">{totals.damage_total.toFixed(1)}</td>
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
                  <span className="ml-2 font-semibold text-foreground">{totals.fires_total}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Погибло:</span>
                  <span className="ml-2 font-semibold text-destructive">{totals.killed_total} чел.</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Травмировано:</span>
                  <span className="ml-2 font-semibold text-orange-600">{totals.injured_total} чел.</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Ущерб:</span>
                  <span className="ml-2 font-semibold text-foreground">{totals.damage_total.toFixed(1)} тыс. тг</span>
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
