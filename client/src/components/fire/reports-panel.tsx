import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { DateRangeField } from "@/components/ui/date-range-field";
import { usePeriodStore } from "@/hooks/use-period-store";

export default function ReportsPanel() {
  const { store, updatePreset } = usePeriodStore();
  const [periodError, setPeriodError] = useState("");
  const [includeOrgTree, setIncludeOrgTree] = useState(false);
  const [validationResults, setValidationResults] = useState<Array<{
    type: 'success' | 'warning' | 'error';
    message: string;
  }>>([]);

  const periodKey = useMemo(() => {
    const from = store.report.from;
    const to = store.report.to;
    const candidate = from || to;
    if (!candidate) return "";
    return candidate.slice(0, 7);
  }, [store.report.from, store.report.to]);

  const handleGenerate = async () => {
    if (!periodKey) {
      setValidationResults([{ type: 'error', message: 'Укажите период для формирования отчёта.' }]);
      setPeriodError("Выберите диапазон дат для периода отчёта.");
      return;
    }
    setPeriodError("");

    try {
      const formsToCheck = ["1-osp", "6-sspz"];
      const params = new URLSearchParams({
        period: periodKey,
        includeChildren: String(includeOrgTree),
      });
      const responses = await Promise.all(
        formsToCheck.map((formId) => fetch(`/api/reports?form=${formId}&${params.toString()}`))
      );
      const payloads = await Promise.all(responses.map((response) => response.json().catch(() => null)));

      if (responses.some((response, index) => !response.ok || !payloads[index]?.ok)) {
        setValidationResults([
          { type: 'error', message: 'Не удалось получить данные отчёта.' },
        ]);
        return;
      }

      const hasData = payloads.some((payload) => hasReportValues(payload?.data));

      if (!hasData) {
        setValidationResults([
          { type: 'warning', message: 'За выбранный период нет данных для формирования отчётов.' },
        ]);
        return;
      }

      setValidationResults([{ type: 'success', message: 'Отчёты сформированы, данные загружены.' }]);
    } catch (error) {
      setValidationResults([{ type: 'error', message: 'Ошибка при обращении к API отчётов.' }]);
    }
  };

  const handleCheck = async () => {
    if (!periodKey) {
      setValidationResults([{ type: 'error', message: 'Укажите период для проверки отчётов.' }]);
      setPeriodError("Выберите диапазон дат для периода отчёта.");
      return;
    }
    setPeriodError("");

    try {
      const params = new URLSearchParams({
        period: periodKey,
        includeChildren: String(includeOrgTree),
      });
      const response = await fetch(`/api/reports/validate?${params.toString()}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        setValidationResults([
          { type: 'error', message: payload?.msg ?? 'Не удалось выполнить проверку отчётов.' },
        ]);
        return;
      }

      const errors = Array.isArray(payload?.errors) ? payload.errors : [];

      if (errors.length === 0) {
        setValidationResults([{ type: 'success', message: 'Ошибок и предупреждений не найдено.' }]);
        return;
      }

      setValidationResults(
        errors.map((error: { form?: string; section?: string; description?: string; severity?: string }) => {
          const prefix = [error.form, error.section].filter(Boolean).join(' · ');
          const message = prefix ? `${prefix}: ${error.description ?? 'Проблема в данных.'}` : error.description;
          const type = error.severity === 'error' ? 'error' : error.severity === 'warning' ? 'warning' : 'success';
          return {
            type,
            message: message ?? 'Обнаружена проблема в данных.',
          };
        })
      );
    } catch (error) {
      setValidationResults([{ type: 'error', message: 'Ошибка при обращении к API проверки.' }]);
    }
  };

  const reportTypes = [
    '1-ОСП', '2-ССГ', '3-СПВП', '4-СОВП', '5-СПЖС', '6-ССПЗ', '7-CO'
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Report Generation */}
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Формирование отчётов</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Период отчёта
                </Label>
                <DateRangeField
                  from={store.report.from}
                  to={store.report.to}
                  onChange={({ from, to }) => {
                    setPeriodError("");
                    updatePreset("report", { from, to });
                  }}
                />
                {periodError ? (
                  <p className="text-xs text-destructive">{periodError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Для отчёта используется месяц начала периода.</p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="orgTree"
                  checked={includeOrgTree}
                  onCheckedChange={(checked) => setIncludeOrgTree(checked as boolean)}
                  data-testid="checkbox-org-tree"
                />
                <Label htmlFor="orgTree" className="text-sm text-foreground">
                  По дереву организаций
                </Label>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerate}
                  data-testid="button-generate-reports"
                >
                  Сформировать
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleCheck}
                  data-testid="button-check-reports"
                >
                  Проверить
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Reports */}
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Печатные формы</h3>
            <div className="grid grid-cols-2 gap-2">
              {reportTypes.map((reportType) => (
                <Button
                  key={reportType}
                  variant="secondary"
                  className="text-sm"
                  data-testid={`button-report-${reportType.toLowerCase()}`}
                >
                  {reportType}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Результаты проверки</h3>
            <div className="space-y-3">
              {validationResults.map((result, index) => {
                const iconProps = {
                  success: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20" },
                  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                  error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" }
                }[result.type];
                
                const Icon = iconProps.icon;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 ${iconProps.bg} border ${iconProps.border} rounded-lg`}
                    data-testid={`validation-result-${result.type}-${index}`}
                  >
                    <Icon className={`w-5 h-5 ${iconProps.color}`} />
                    <span className="text-foreground">{result.message}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const hasReportValues = (reportData?: {
  rows?: Array<{ values?: Record<string, unknown>; value?: number; children?: any[] }>;
  steppeRows?: Array<{ values?: Record<string, unknown> }>;
  ignitionRows?: Array<{ values?: Record<string, unknown> }>;
}) => {
  const rowHasValue = (row: { values?: Record<string, unknown>; value?: number; children?: any[] }) => {
    if (typeof row.value === "number") {
      return row.value > 0;
    }
    if (row.values) {
      return Object.values(row.values).some((value) => Number(value) > 0);
    }
    if (row.children) {
      return row.children.some(rowHasValue);
    }
    return false;
  };

  return (
    (reportData?.rows ?? []).some(rowHasValue) ||
    (reportData?.steppeRows ?? []).some(rowHasValue) ||
    (reportData?.ignitionRows ?? []).some(rowHasValue)
  );
};
