import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FORM_7_CO_ROWS, Form7CORow } from "@shared/fire-forms-data";
import { Download, Send, Printer, AlertTriangle, ChevronDown, ChevronRight, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReportForm } from "@/components/reports/use-report-form";

interface ValidationError {
  rowId: string;
  message: string;
  type: 'error' | 'warning';
}

interface COData {
  killed_total: number;
  injured_total: number;
}

export default function FormCO() {
  const now = new Date();
  const [reportMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0")
  );
  const [reportYear] = useState(now.getFullYear().toString());
  const [region] = useState("Республика Казахстан (Свод)");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const { toast } = useToast();
  const period = reportMonth && reportYear ? `${reportYear}-${reportMonth}` : undefined;

  const { reportData, isLoading, saveReport } = useReportForm<COData>({
    formId: "co",
    period,
    extractData: (payload) => {
      const rows = payload?.rows ?? [];
      const map: Record<string, COData> = {};
      const walk = (items: any[]) => {
        items.forEach((item) => {
          if (item.values) {
            map[item.id] = item.values;
          }
          if (item.children) {
            walk(item.children);
          }
        });
      };
      walk(rows);
      return map;
    },
  });

  const formMeta = {
    formCode: "7-CO",
    formName: "Сведения о погибших и травмированных людях от отравления угарным газом в жилом секторе, не повлекшего возникновения пожара",
    order: "Приказ Министра по чрезвычайным ситуациям Республики Казахстан от 28.08.2025 № 377",
    periodicity: "ежемесячная",
    submitUntilDay: 27,
    method: "electronic",
    languages: ["ru", "kz"],
    respondents: "территориальные органы Министерства по чрезвычайным ситуациям Республики Казахстан"
  };

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    const checkRow = (row: Form7CORow) => {
      const data = getCOData(row.id);
      if (data.killed_total < 0 || data.injured_total < 0) {
        errors.push({
          rowId: row.id,
          message: `Строка ${row.number}: Отрицательные значения не допускаются`,
          type: 'error'
        });
      }
      row.children?.forEach(checkRow);
    };
    
    FORM_7_CO_ROWS.forEach(checkRow);

    const sumDirectChildren = (rowId: string) => {
      const totalRow = FORM_7_CO_ROWS.find(row => row.id === rowId);
      if (!totalRow?.children) {
        return null;
      }
      return totalRow.children.reduce(
        (acc, child) => {
          const data = getCOData(child.id);
          return {
            killed_total: acc.killed_total + data.killed_total,
            injured_total: acc.injured_total + data.injured_total
          };
        },
        { killed_total: 0, injured_total: 0 }
      );
    };

    const totalKilledRow = FORM_7_CO_ROWS.find(row => row.id === '1');
    const killedChildrenSum = sumDirectChildren('1');
    if (totalKilledRow && killedChildrenSum) {
      const totalData = getCOData(totalKilledRow.id);
      if (totalData.killed_total !== killedChildrenSum.killed_total) {
        errors.push({
          rowId: totalKilledRow.id,
          message: "Строка 1 должна быть равна сумме подпунктов 1.1–1.3 по погибшим",
          type: 'error'
        });
      }
      if (totalData.injured_total !== killedChildrenSum.injured_total) {
        errors.push({
          rowId: totalKilledRow.id,
          message: "Строка 1 должна быть равна сумме подпунктов 1.1–1.3 по травмированным",
          type: 'error'
        });
      }
    }

    const totalInjuredRow = FORM_7_CO_ROWS.find(row => row.id === '11');
    const injuredChildrenSum = sumDirectChildren('11');
    if (totalInjuredRow && injuredChildrenSum) {
      const totalData = getCOData(totalInjuredRow.id);
      if (totalData.killed_total !== injuredChildrenSum.killed_total) {
        errors.push({
          rowId: totalInjuredRow.id,
          message: "Строка 11 должна быть равна сумме подпунктов 11.1–11.3 по погибшим",
          type: 'error'
        });
      }
      if (totalData.injured_total !== injuredChildrenSum.injured_total) {
        errors.push({
          rowId: totalInjuredRow.id,
          message: "Строка 11 должна быть равна сумме подпунктов 11.1–11.3 по травмированным",
          type: 'error'
        });
      }
    }

    return errors;
  };

  const handleValidate = () => {
    const errors = validateForm();
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      toast({
        title: "Валидация пройдена",
        description: "Все данные корректны"
      });
    } else {
      toast({
        title: "Обнаружены проблемы",
        description: `Найдено ${errors.length} замечаний`,
        variant: "destructive"
      });
    }
  };

  const getCOData = (rowId: string): COData => {
    return reportData[rowId] || {
      killed_total: 0,
      injured_total: 0
    };
  };

  const toggleRow = (rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  const getTotals = () => {
    return getCOData('1');
  };

  const handleExport = () => {
    const csvHeader = "Код строки,Наименование показателя,Погибло людей,Травмировано людей\n";
    
    const flattenRows = (rows: Form7CORow[], level = 0): string[] => {
      return rows.flatMap(row => {
        const data = getCOData(row.id);
        const prefix = "  ".repeat(level);
        const rowLine = `"${row.number || ''}","${prefix}${row.label}",${data.killed_total},${data.injured_total}`;
        const childLines = row.children ? flattenRows(row.children, level + 1) : [];
        return [rowLine, ...childLines];
      });
    };
    
    const csvData = flattenRows(FORM_7_CO_ROWS).join('\n');
    const csvContent = csvHeader + csvData;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_7_co_${reportMonth}_${reportYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Экспорт завершен",
      description: "Форма 7-CO экспортирована в CSV"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.filter(e => e.type === 'error').length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Ошибка",
        description: "Исправьте ошибки перед отправкой",
        variant: "destructive"
      });
      return;
    }

    if (!reportMonth || !reportYear) {
      toast({
        title: "Ошибка",
        description: "Укажите отчетный период",
        variant: "destructive"
      });
      return;
    }

    try {
      await saveReport("submitted");
      toast({
        title: "Форма отправлена",
        description: "Форма 7-CO успешно отправлена в КПС МЧС РК"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить форму 7-CO",
        variant: "destructive"
      });
    }
  };

  const renderRow = (row: Form7CORow, level = 0) => {
    const data = getCOData(row.id);
    const hasChildren = row.children && row.children.length > 0;
    const isExpanded = expandedRows.has(row.id);

    return (
      <tr key={row.id} className={`hover:bg-secondary/30 ${level === 0 ? 'bg-secondary/20' : ''}`}>
        <td className="border border-border p-2 text-center font-medium w-16">
          {row.number}
        </td>
        <td className="border border-border p-2" style={{ paddingLeft: `${level * 20 + 8}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button
                onClick={() => toggleRow(row.id)}
                className="p-0.5 hover:bg-secondary rounded"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            {!hasChildren && level > 0 && <span className="w-5" />}
            <span>{row.label}</span>
          </div>
        </td>
        <td className="border border-border p-2 w-28">
          <Input
            type="number"
            min="0"
            step="1"
            value={data.killed_total || ''}
            className="text-center"
            placeholder="0"
            readOnly
          />
        </td>
        <td className="border border-border p-2 w-28">
          <Input
            type="number"
            min="0"
            step="1"
            value={data.injured_total || ''}
            className="text-center"
            placeholder="0"
            readOnly
          />
        </td>
      </tr>
    );
  };

  const renderRows = (rows: Form7CORow[], level = 0): JSX.Element[] => {
    return rows.flatMap(row => {
      const elements = [renderRow(row, level)];
      if (row.children && expandedRows.has(row.id)) {
        elements.push(...renderRows(row.children, level + 1));
      }
      return elements;
    });
  };

  const months = [
    { value: '01', label: 'январь' },
    { value: '02', label: 'февраль' },
    { value: '03', label: 'март' },
    { value: '04', label: 'апрель' },
    { value: '05', label: 'май' },
    { value: '06', label: 'июнь' },
    { value: '07', label: 'июль' },
    { value: '08', label: 'август' },
    { value: '09', label: 'сентябрь' },
    { value: '10', label: 'октябрь' },
    { value: '11', label: 'ноябрь' },
    { value: '12', label: 'декабрь' }
  ];

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

  const regions = [
    "Республика Казахстан (Свод)",
    "г. Астана",
    "г. Алматы",
    "г. Шымкент",
    "Акмолинская область",
    "Актюбинская область",
    "Алматинская область",
    "Атырауская область",
    "Восточно-Казахстанская область",
    "Жамбылская область",
    "Западно-Казахстанская область",
    "Карагандинская область",
    "Костанайская область",
    "Кызылординская область",
    "Мангистауская область",
    "Павлодарская область",
    "Северо-Казахстанская область",
    "Туркестанская область",
    "Улытауская область",
    "Абай область",
    "Жетісу область"
  ];

  return (
    <div className="space-y-6 print:space-y-2">
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="print:pb-2">
          <CardTitle className="flex items-center gap-2 print:text-lg">
            <AlertTriangle className="h-5 w-5 text-red-500 print:hidden" />
            Форма 7-CO: {formMeta.formName}
          </CardTitle>
          <div className="text-sm text-muted-foreground print:text-xs">
            {formMeta.order}
          </div>
          <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded print:hidden">
            Форма заполняется только по случаям, не повлекшим возникновения пожара
          </div>
        </CardHeader>
        <CardContent className="space-y-6 print:space-y-2">
          {isLoading && (
            <div className="text-sm text-muted-foreground">Загрузка данных...</div>
          )}
          <Card className="bg-slate-50 dark:bg-slate-900/40 print:hidden">
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                <Info className="h-4 w-4" />
                Метаданные формы
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground">
                <div><span className="font-medium text-foreground">Код формы:</span> {formMeta.formCode}</div>
                <div><span className="font-medium text-foreground">Периодичность:</span> {formMeta.periodicity}</div>
                <div><span className="font-medium text-foreground">Срок сдачи:</span> до {formMeta.submitUntilDay} числа</div>
                <div><span className="font-medium text-foreground">Метод:</span> {formMeta.method}</div>
                <div><span className="font-medium text-foreground">Языки:</span> {formMeta.languages.join(", ")}</div>
                <div><span className="font-medium text-foreground">Респонденты:</span> {formMeta.respondents}</div>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Отчетный период</Label>
                <Select value={reportMonth} disabled>
                  <SelectTrigger disabled>
                    <SelectValue placeholder="Месяц" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label>&nbsp;</Label>
                <Select value={reportYear} disabled>
                  <SelectTrigger disabled>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y}>{y} г.</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Регион</Label>
              <Select value={region} disabled>
                <SelectTrigger disabled>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                Всего погибших: <span className="font-bold text-destructive">{getTotals().killed_total}</span>
              </div>
            </div>
          </div>

          <div className="text-center print:mt-4">
            <p className="text-sm text-muted-foreground">Форма, предназначенная для сбора административных данных</p>
            <h2 className="text-lg font-bold mt-2">СВЕДЕНИЯ О ПОГИБШИХ И ТРАВМИРОВАННЫХ ОТ ОТРАВЛЕНИЯ УГАРНЫМ ГАЗОМ</h2>
            <p className="text-sm">за _{months.find(m => m.value === reportMonth)?.label || '________'}_ месяц {reportYear} года</p>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-secondary print:bg-gray-100">
                  <th rowSpan={2} className="border border-border p-2 text-center">Код строки</th>
                  <th rowSpan={2} className="border border-border p-2 text-left">Наименование показателя</th>
                  <th className="border border-border p-2 text-center">Погибло людей</th>
                  <th className="border border-border p-2 text-center">Травмировано людей</th>
                </tr>
                <tr className="bg-secondary/50 text-xs">
                  <th className="border border-border p-1 text-center">1</th>
                  <th className="border border-border p-1 text-center">2</th>
                </tr>
              </thead>
              <tbody>
                {renderRows(FORM_7_CO_ROWS)}
              </tbody>
            </table>
          </div>

          <div className="border border-border rounded-lg p-4 mt-6 space-y-4 print:mt-8 print:border-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Наименование организации</Label>
                <Input placeholder="Наименование ДЧС / ОГПС" className="mt-1" readOnly />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Адрес</Label>
                <Input placeholder="Полный адрес организации" className="mt-1" readOnly />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Телефон</Label>
                <Input placeholder="+7 (___) ___-__-__" className="mt-1" readOnly />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input placeholder="email@example.kz" className="mt-1" readOnly />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div>
                <Label className="text-xs text-muted-foreground">Исполнитель (Ф.И.О.)</Label>
                <Input placeholder="Фамилия И.О." className="mt-1" readOnly />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Телефон исполнителя</Label>
                <Input placeholder="+7 (___) ___-__-__" className="mt-1" readOnly />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Подпись исполнителя</Label>
                <Input placeholder="Подпись" className="mt-1" readOnly />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div>
                <Label className="text-xs text-muted-foreground">Руководитель (Ф.И.О.)</Label>
                <Input placeholder="Фамилия И.О." className="mt-1" readOnly />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Подпись руководителя</Label>
                <Input placeholder="Подпись" className="mt-1" readOnly />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Дата</Label>
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="mt-1" readOnly />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border print:pt-6">
              <div className="text-center w-24 h-24 border border-dashed border-border rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground">М.П.</span>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                <p>Форма представляется ежемесячно</p>
                <p>до {formMeta.submitUntilDay} числа месяца, следующего за отчетным</p>
              </div>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/10 print:hidden">
              <CardContent className="p-4">
                <h4 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Ошибки валидации
                </h4>
                <ul className="space-y-1 text-sm">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className={error.type === 'error' ? 'text-red-600' : 'text-yellow-600'}>
                      {error.type === 'error' ? '❌' : '⚠️'} {error.message}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-4 pt-4 print:hidden">
            <Button onClick={handleValidate} variant="outline" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Проверить
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Печать
            </Button>
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
