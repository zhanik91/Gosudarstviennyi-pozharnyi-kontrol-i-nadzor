import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NON_FIRE_CASES } from "@shared/fire-forms-data";
import { Download, FileText, Send, Printer, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReportForm } from "@/components/reports/use-report-form";

interface ValidationError {
  rowCode: string;
  message: string;
  type: 'error' | 'warning';
}

export default function Form2SSG() {
  const now = new Date();
  const [reportMonth, setReportMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0")
  );
  const [reportYear, setReportYear] = useState(now.getFullYear().toString());
  const [region, setRegion] = useState("Республика Казахстан (Свод)");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const { toast } = useToast();
  const period = reportMonth && reportYear ? `${reportYear}-${reportMonth}` : undefined;

  const { reportData, isLoading, saveReport } = useReportForm<number>({
    formId: "2-ssg",
    period,
    region,
    extractData: (payload) => {
      const rows = payload?.rows ?? [];
      return rows.reduce((acc: Record<string, number>, row: any) => {
        acc[row.code] = row.value ?? 0;
        return acc;
      }, {});
    },
  });

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    NON_FIRE_CASES.forEach(case_ => {
      const value = reportData[case_.code] || 0;
      if (value < 0) {
        errors.push({
          rowCode: case_.code,
          message: `Строка ${case_.code}: Отрицательные значения не допускаются`,
          type: 'error'
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

  const getTotalCases = () => {
    return Object.values(reportData).reduce((sum, value) => sum + value, 0);
  };

  const handleExport = () => {
    const csvHeader = "Код строки,Случаи горения не подлежащие учету как пожары,Количество\n";
    const csvData = NON_FIRE_CASES.map((case_) => {
      return `"${case_.code}","${case_.name}",${reportData[case_.code] || 0}`;
    }).join('\n');
    
    const totalRow = `\n"","ИТОГО:",${getTotalCases()}`;
    const csvContent = csvHeader + csvData + totalRow;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_2_ssg_${reportMonth}_${reportYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Экспорт завершен",
      description: "Форма 2-ССГ экспортирована в CSV"
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
        description: "Форма 2-ССГ успешно отправлена в КПС МЧС РК"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить форму 2-ССГ",
        variant: "destructive"
      });
    }
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
            <FileText className="h-5 w-5 print:hidden" />
            Форма 2-ССГ: Сведения о случаях горения, не подлежащие учету как пожары
          </CardTitle>
          <div className="text-sm text-muted-foreground print:text-xs">
            Приложение 2 к приказу Министра по чрезвычайным ситуациям Республики Казахстан от 28 августа 2025 года № 377
          </div>
        </CardHeader>
        <CardContent className="space-y-6 print:space-y-2">
          {isLoading && (
            <div className="text-sm text-muted-foreground">Загрузка данных...</div>
          )}
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
                Всего случаев: <span className="font-bold text-foreground">{getTotalCases()}</span>
              </div>
            </div>
          </div>

          <div className="text-center print:mt-4">
            <p className="text-sm text-muted-foreground">Форма, предназначенная для сбора административных данных</p>
            <h2 className="text-lg font-bold mt-2">СВЕДЕНИЯ О СЛУЧАЯХ ГОРЕНИЯ, НЕ ПОДЛЕЖАЩИЕ УЧЕТУ КАК ПОЖАРЫ</h2>
            <p className="text-sm">за _{months.find(m => m.value === reportMonth)?.label || '________'}_ месяц {reportYear} года</p>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse border border-border text-sm">
              <thead>
                <tr className="bg-secondary print:bg-gray-100">
                  <th className="border border-border p-2 text-center w-20">Код строки</th>
                  <th className="border border-border p-2 text-left">Случаи горения, не подлежащие учету как пожары</th>
                  <th className="border border-border p-2 text-center w-28">Количество</th>
                </tr>
                <tr className="bg-secondary/50 text-xs">
                  <th className="border border-border p-1 text-center">А</th>
                  <th className="border border-border p-1 text-center">Б</th>
                  <th className="border border-border p-1 text-center">1</th>
                </tr>
              </thead>
              <tbody>
                {NON_FIRE_CASES.map((case_) => (
                  <tr key={case_.code} className="hover:bg-secondary/30">
                    <td className="border border-border p-2 text-center font-medium">
                      {case_.code}
                    </td>
                    <td className="border border-border p-2">
                      {case_.name}
                    </td>
                    <td className="border border-border p-2">
                      <Input
                        type="number"
                        min="0"
                        value={reportData[case_.code] || ''}
                        placeholder="0"
                        className="text-center"
                        readOnly
                      />
                    </td>
                  </tr>
                ))}
                <tr className="bg-yellow-100 dark:bg-yellow-900/20 font-bold">
                  <td className="border border-border p-2 text-center"></td>
                  <td className="border border-border p-2">ИТОГО:</td>
                  <td className="border border-border p-2 text-center">{getTotalCases()}</td>
                </tr>
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
                <Label className="text-xs text-muted-foreground">БИН организации</Label>
                <Input placeholder="XXXXXXXXXXXX" maxLength={12} className="mt-1" readOnly />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Исполнитель</Label>
                <Input placeholder="Фамилия И.О., должность" className="mt-1" readOnly />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Телефон исполнителя</Label>
                <Input placeholder="+7 (___) ___-__-__" className="mt-1" readOnly />
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
                <Input placeholder="Фамилия И.О." className="text-center" readOnly />
                <Label className="text-xs text-muted-foreground">расшифровка подписи</Label>
              </div>
              <div className="text-center">
                <Input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="text-center" readOnly />
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
