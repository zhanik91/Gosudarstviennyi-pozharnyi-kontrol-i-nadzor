import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FORM_1_OSP_ROWS, Form1OSPRow } from "@shared/fire-forms-data";
import { Download, FileText, Send, Printer, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReportForm } from "@/components/reports/use-report-form";

interface RowData {
  total: number;
  urban: number;
  rural: number;
}

interface ValidationError {
  rowId: string;
  message: string;
  type: 'error' | 'warning';
}

export default function Form1OSP() {
  const now = new Date();
  const [reportMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0")
  );
  const [reportYear] = useState(now.getFullYear().toString());
  const [region] = useState("Республика Казахстан (Свод)");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const period = reportMonth && reportYear ? `${reportYear}-${reportMonth}` : undefined;

  const { reportData, isLoading, saveReport } = useReportForm<RowData>({
    formId: "1-osp",
    period,
    extractData: (payload) => {
      const rows = payload?.rows ?? [];
      const map: Record<string, RowData> = {};
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

  const getRowData = (rowId: string): RowData => {
    return reportData[rowId] || { total: 0, urban: 0, rural: 0 };
  };

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    const flattenRows = (rows: Form1OSPRow[]): Form1OSPRow[] => {
      return rows.reduce((acc, row) => {
        acc.push(row);
        if (row.children) {
          acc.push(...flattenRows(row.children));
        }
        return acc;
      }, [] as Form1OSPRow[]);
    };

    const allRows = flattenRows(FORM_1_OSP_ROWS);
    
    allRows.forEach(row => {
      const data = getRowData(row.id);
      if (data.total !== data.urban + data.rural && (data.total > 0 || data.urban > 0 || data.rural > 0)) {
        errors.push({
          rowId: row.id,
          message: `Строка ${row.number}: "Всего" (${data.total}) должно быть равно сумме "в городах" (${data.urban}) + "в сельской местности" (${data.rural})`,
          type: 'error'
        });
      }
      if (data.total < 0 || data.urban < 0 || data.rural < 0) {
        errors.push({
          rowId: row.id,
          message: `Строка ${row.number}: Отрицательные значения не допускаются`,
          type: 'error'
        });
      }
    });

    FORM_1_OSP_ROWS.forEach(parentRow => {
      if (parentRow.children) {
        const parentData = getRowData(parentRow.id);
        parentRow.children.forEach(childRow => {
          const childData = getRowData(childRow.id);
          if (childData.total > parentData.total && parentData.total > 0) {
            errors.push({
              rowId: childRow.id,
              message: `Подпункт ${childRow.number} (${childData.total}) не может превышать основной пункт ${parentRow.number} (${parentData.total})`,
              type: 'warning'
            });
          }
        });
      }
    });

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
        title: "Обнаружены ошибки",
        description: `Найдено ${errors.length} проблем`,
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    const csvHeader = "Код строки,Наименование показателя,Всего,В городах,В сельской местности\n";
    
    const flattenRows = (rows: Form1OSPRow[], indent = 0): string[] => {
      return rows.reduce((acc, row) => {
        const data = getRowData(row.id);
        const prefix = indent > 0 ? "  ".repeat(indent) : "";
        acc.push(`"${row.number}","${prefix}${row.label}",${data.total},${data.urban},${data.rural}`);
        if (row.children) {
          acc.push(...flattenRows(row.children, indent + 1));
        }
        return acc;
      }, [] as string[]);
    };

    const csvData = flattenRows(FORM_1_OSP_ROWS).join('\n');
    const csvContent = csvHeader + csvData;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_1_osp_${reportMonth}_${reportYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Экспорт завершен",
      description: "Форма 1-ОСП экспортирована в CSV"
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.filter(e => e.type === 'error').length > 0) {
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
        description: "Форма 1-ОСП успешно отправлена в КПС МЧС РК"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить форму 1-ОСП",
        variant: "destructive"
      });
    }
  };

  const renderRow = (row: Form1OSPRow, isChild = false) => {
    const data = getRowData(row.id);
    const hasError = validationErrors.some(e => e.rowId === row.id);
    const isDecimal = row.valueType === 'decimal';
    
    return (
      <tr key={row.id} className={`hover:bg-secondary/30 ${hasError ? 'bg-red-50 dark:bg-red-900/10' : ''} ${isChild ? 'bg-secondary/20' : ''}`}>
        <td className="border border-border p-2 text-center font-medium w-16">
          {row.number}
        </td>
        <td className={`border border-border p-2 ${isChild ? 'pl-8' : ''}`}>
          {row.label}
        </td>
        <td className="border border-border p-2 w-28">
          <Input
            type="number"
            min="0"
            step={isDecimal ? "0.1" : "1"}
            value={data.total || ''}
            className={`text-center ${hasError ? 'border-red-500' : ''}`}
            placeholder="0"
            readOnly
          />
        </td>
        <td className="border border-border p-2 w-28">
          <Input
            type="number"
            min="0"
            step={isDecimal ? "0.1" : "1"}
            value={data.urban || ''}
            className="text-center"
            placeholder="0"
            readOnly
          />
        </td>
        <td className="border border-border p-2 w-28">
          <Input
            type="number"
            min="0"
            step={isDecimal ? "0.1" : "1"}
            value={data.rural || ''}
            className="text-center"
            placeholder="0"
            readOnly
          />
        </td>
      </tr>
    );
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
    <div className="space-y-6 print:space-y-2" ref={printRef}>
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="print:pb-2">
          <CardTitle className="flex items-center gap-2 print:text-lg">
            <FileText className="h-5 w-5 print:hidden" />
            Форма 1-ОСП: Общие сведения о пожарах и гибели людей
          </CardTitle>
          <div className="text-sm text-muted-foreground print:text-xs">
            Приложение 1 к приказу Министра по чрезвычайным ситуациям Республики Казахстан от 28 августа 2025 года № 377
          </div>
        </CardHeader>
        <CardContent className="space-y-6 print:space-y-2">
          {isLoading && (
            <div className="text-sm text-muted-foreground">Загрузка данных...</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            <div>
              <Label>Форма отчета</Label>
              <Select defaultValue="1-osp" disabled>
                <SelectTrigger disabled>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-osp">Приложение 1 (Общие сведения)</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>

          <div className="text-center print:mt-4">
            <p className="text-sm text-muted-foreground">Форма, предназначенная для сбора административных данных</p>
            <h2 className="text-lg font-bold mt-2">ОБЩИЕ СВЕДЕНИЯ О ПОЖАРАХ И ГИБЕЛИ ЛЮДЕЙ</h2>
            <p className="text-sm">за _{months.find(m => m.value === reportMonth)?.label || '________'}_ месяц {reportYear} года</p>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-secondary print:bg-gray-100">
                  <th rowSpan={2} className="border border-border p-2 text-center">Код строки</th>
                  <th rowSpan={2} className="border border-border p-2 text-left">Наименование показателя</th>
                  <th colSpan={3} className="border border-border p-2 text-center">В том числе</th>
                </tr>
                <tr className="bg-secondary/70 print:bg-gray-50">
                  <th className="border border-border p-2 text-center">Всего</th>
                  <th className="border border-border p-2 text-center">в городах</th>
                  <th className="border border-border p-2 text-center">в сельской местности</th>
                </tr>
                <tr className="bg-secondary/50 text-xs">
                  <th className="border border-border p-1 text-center">А</th>
                  <th className="border border-border p-1 text-center">Б</th>
                  <th className="border border-border p-1 text-center">1</th>
                  <th className="border border-border p-1 text-center">2</th>
                  <th className="border border-border p-1 text-center">3</th>
                </tr>
              </thead>
              <tbody>
                {FORM_1_OSP_ROWS.flatMap(row => [
                  renderRow(row),
                  ...(row.children?.map(child => renderRow(child, true)) || [])
                ])}
              </tbody>
            </table>
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

          <div className="border border-border rounded-lg p-4 mt-6 space-y-4 print:mt-8 print:border-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Наименование организации</Label>
                <Input 
                  placeholder="Наименование ДЧС / ОГПС"
                  className="mt-1"
                  readOnly
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">БИН организации</Label>
                <Input 
                  placeholder="XXXXXXXXXXXX"
                  maxLength={12}
                  className="mt-1"
                  readOnly
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Исполнитель</Label>
                <Input 
                  placeholder="Фамилия И.О., должность"
                  className="mt-1"
                  readOnly
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Телефон исполнителя</Label>
                <Input 
                  placeholder="+7 (___) ___-__-__"
                  className="mt-1"
                  readOnly
                />
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
                <Input 
                  placeholder="Фамилия И.О."
                  className="text-center"
                  readOnly
                />
                <Label className="text-xs text-muted-foreground">расшифровка подписи</Label>
              </div>
              <div className="text-center">
                <Input 
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="text-center"
                  readOnly
                />
                <Label className="text-xs text-muted-foreground">дата</Label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border print:pt-6">
              <div className="text-center w-24 h-24 border border-dashed border-border rounded-lg flex items-center justify-center">
                <span className="text-xs text-muted-foreground">М.П.</span>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                <p>Форма представляется ежемесячно</p>
                <p>до 27 числа месяца, следующего за отчетным</p>
              </div>
            </div>
          </div>

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
