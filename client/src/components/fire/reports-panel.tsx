import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export default function ReportsPanel() {
  const [period, setPeriod] = useState("");
  const [includeOrgTree, setIncludeOrgTree] = useState(false);
  const [validationResults, setValidationResults] = useState<Array<{
    type: 'success' | 'warning' | 'error';
    message: string;
  }>>([]);

  const handleGenerate = () => {
    // Simulate report generation
    setValidationResults([
      { type: 'success', message: 'Баланс 1-ОСП корректен' },
      { type: 'warning', message: 'Предупреждение: ОВСР "в т.ч." больше "всего" в 2 записях' },
      { type: 'error', message: 'Ошибка: Не заполнены обязательные поля в инциденте #247' }
    ]);
  };

  const handleCheck = () => {
    // Simulate validation check
    setValidationResults([
      { type: 'success', message: 'Все обязательные поля заполнены' },
      { type: 'warning', message: 'Найдено 3 предупреждения в данных' }
    ]);
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
              <div>
                <Label htmlFor="period" className="text-sm font-medium text-foreground mb-2">
                  Период (YYYY-MM)
                </Label>
                <Input
                  id="period"
                  type="text"
                  placeholder="2025-01"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  data-testid="input-report-period"
                />
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
