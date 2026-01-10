import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FORM_7_CO_ROWS, Form7CORow } from "@/data/fire-forms-data";
import { Download, FileText, Send, Printer, AlertTriangle, ChevronDown, ChevronRight, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [reportData, setReportData] = useState<Record<string, COData>>({});
  const [reportMonth, setReportMonth] = useState("");
  const [reportYear, setReportYear] = useState(new Date().getFullYear().toString());
  const [region, setRegion] = useState("Республика Казахстан (Свод)");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [description, setDescription] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const { toast } = useToast();

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

  const handleInputChange = (rowId: string, field: keyof COData, value: string) => {
    const numValue = parseInt(value) || 0;
    setReportData(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [field]: numValue
      }
    }));
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
    const totals = {
      killed_total: 0,
      injured_total: 0
    };

    Object.values(reportData).forEach(data => {
      totals.killed_total += data.killed_total;
      totals.injured_total += data.injured_total;
    });

    return totals;
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
    const totals = getTotals();
    const totalRow = `\n"","ИТОГО:",${totals.killed_total},${totals.injured_total}`;
    const descriptionRow = `\n\n"Описание обстоятельств:","${description.replace(/"/g, '""')}"`;
    
    const csvContent = csvHeader + csvData + totalRow + descriptionRow;
    
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

  const handleSubmit = () => {
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

    console.log("Отправка формы 7-CO:", { reportMonth, reportYear, region, data: reportData, description });
    
    toast({
      title: "Форма отправлена",
      description: "Форма 7-CO успешно отправлена в КПС МЧС РК"
    });
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
            value={data.killed_total || ''}
            onChange={(e) => handleInputChange(row.id, 'killed_total', e.target.value)}
            className="text-center"
            placeholder="0"
          />
        </td>
        <td className="border border-border p-2 w-28">
          <Input
            type="number"
            min="0"
            value={data.injured_total || ''}
            onChange={(e) => handleInputChange(row.id, 'injured_total', e.target.value)}
            className="text-center"
            placeholder="0"
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
            Форма 7-CO: Сведения о погибших и травмированных от отравления угарным газом
          </CardTitle>
          <div className="text-sm text-muted-foreground print:text-xs">
            Приложение 7 к приказу Министра по чрезвычайным ситуациям Республики Казахстан от 28 августа 2025 года № 377
          </div>
          <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded print:hidden">
            Случаи в результате нарушений требований пожарной безопасности, не повлекших возникновения пожара
          </div>
        </CardHeader>
        <CardContent className="space-y-6 print:space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Отчетный период</Label>
                <Select value={reportMonth} onValueChange={setReportMonth}>
                  <SelectTrigger>
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
                <Select value={reportYear} onValueChange={setReportYear}>
                  <SelectTrigger>
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
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
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
                <tr className="bg-yellow-100 dark:bg-yellow-900/20 font-bold">
                  <td className="border border-border p-2 text-center"></td>
                  <td className="border border-border p-2">ИТОГО:</td>
                  <td className="border border-border p-2 text-center">{getTotals().killed_total}</td>
                  <td className="border border-border p-2 text-center">{getTotals().injured_total}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Card className="print:hidden">
            <CardHeader>
              <CardTitle className="text-lg">Описание обстоятельств</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="description">
                Подробное описание обстоятельств происшествий и принятых мер
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Укажите обстоятельства каждого случая отравления угарным газом, принятые меры профилактики..."
                className="mt-2 min-h-[120px]"
              />
            </CardContent>
          </Card>

          <Card className="bg-red-50 dark:bg-red-900/20 print:hidden">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Итоговая статистика
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{getTotals().killed_total}</div>
                  <div className="text-muted-foreground">Погибло людей</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{getTotals().injured_total}</div>
                  <div className="text-muted-foreground">Травмировано людей</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="border border-border rounded-lg p-4 mt-6 space-y-4 print:mt-8 print:border-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Наименование организации</Label>
                <Input placeholder="Наименование ДЧС / ОГПС" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">БИН организации</Label>
                <Input placeholder="XXXXXXXXXXXX" maxLength={12} className="mt-1" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Исполнитель</Label>
                <Input placeholder="Фамилия И.О., должность" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Телефон исполнителя</Label>
                <Input placeholder="+7 (___) ___-__-__" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="border-b border-border pb-6 mb-1">
                  <span className="text-muted-foreground text-xs">подпись</span>
                </div>
                <Label className="text-xs">Руководитель</Label>
              </div>
              <div className="text-center">
                <Input placeholder="Фамилия И.О." className="text-center" />
                <Label className="text-xs text-muted-foreground">расшифровка подписи</Label>
              </div>
              <div className="text-center">
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="text-center" />
                <Label className="text-xs text-muted-foreground">дата</Label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border print:pt-6">
              <div className="text-center w-24 h-24 border border-dashed border-border rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground">М.П.</span>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                <p>Форма представляется ежемесячно</p>
                <p>до 5 числа месяца, следующего за отчетным</p>
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
