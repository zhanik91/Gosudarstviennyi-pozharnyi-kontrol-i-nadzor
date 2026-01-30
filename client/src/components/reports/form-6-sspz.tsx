import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FORM_6_STEPPE_FIRES_ROWS, FORM_6_IGNITIONS_ROWS, Form6SSPZRow } from "@shared/fire-forms-data";
import { Download, Send, Printer, Flame, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReportForm } from "@/components/reports/use-report-form";
import { useReportPeriod } from "@/components/reports/use-report-period";

interface ValidationError {
  rowId: string;
  message: string;
  type: 'error' | 'warning';
}

interface SteppeFireData {
  fires_count: number;
  steppe_area: number;
  damage_total: number;
  people_total: number;
  people_dead: number;
  people_injured: number;
  animals_total: number;
  animals_dead: number;
  animals_injured: number;
  extinguished_total: number;
  extinguished_area: number;
  extinguished_damage: number;
  garrison_people: number;
  garrison_units: number;
  mchs_people: number;
  mchs_units: number;
}

export default function Form6SSPZ() {
  const { periodKey, reportMonth, reportYear, setReportMonth, setReportYear } = useReportPeriod();
  const [region, setRegion] = useState("Республика Казахстан (Свод)");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const { toast } = useToast();
  const period = periodKey || undefined;

  const { reportData, isLoading, saveReport } = useReportForm<SteppeFireData>({
    formId: "6-sspz",
    period,
    region,
    extractData: (payload) => {
      const map: Record<string, SteppeFireData> = {};
      const steppeRows = payload?.steppeRows ?? [];
      const ignitionRows = payload?.ignitionRows ?? [];
      [...steppeRows, ...ignitionRows].forEach((row: any) => {
        if (row.values) {
          map[row.id] = row.values;
        }
      });
      return map;
    },
  });

  const columnDefinitions = [
    { key: 'fires_count', label: 'Количество пожаров', valueType: 'integer' },
    { key: 'steppe_area', label: 'Степная площадь (гектар)', valueType: 'decimal', precision: 1 },
    { key: 'damage_total', label: 'Общий ущерб (тысяч тенге)', valueType: 'decimal', precision: 1 },
    { key: 'people_total', label: 'всего', group: 'Число пострадавших людей', valueType: 'integer' },
    { key: 'people_dead', label: 'погибло', group: 'Число пострадавших людей', valueType: 'integer' },
    { key: 'people_injured', label: 'травмировано', group: 'Число пострадавших людей', valueType: 'integer' },
    { key: 'animals_total', label: 'всего', group: 'Число пострадавших животных (голов)', valueType: 'integer' },
    { key: 'animals_dead', label: 'погибло', group: 'Число пострадавших животных (голов)', valueType: 'integer' },
    { key: 'animals_injured', label: 'травмировано', group: 'Число пострадавших животных (голов)', valueType: 'integer' },
    { key: 'extinguished_total', label: 'всего', group: 'Ликвидировано степных пожаров', valueType: 'integer' },
    { key: 'extinguished_area', label: 'Степная площадь (гектар)', group: 'Ликвидировано степных пожаров', valueType: 'decimal', precision: 1 },
    { key: 'extinguished_damage', label: 'Общий ущерб (тысяч тенге)', group: 'Ликвидировано степных пожаров', valueType: 'decimal', precision: 1 },
    { key: 'garrison_people', label: 'человек', group: 'сил и средств гарнизона противопожарной службы', valueType: 'integer' },
    { key: 'garrison_units', label: 'техники', group: 'сил и средств гарнизона противопожарной службы', valueType: 'integer' },
    { key: 'mchs_people', label: 'человек', group: 'Привлечено сил и средств МЧС РК', valueType: 'integer' },
    { key: 'mchs_units', label: 'техники', group: 'Привлечено сил и средств МЧС РК', valueType: 'integer' }
  ] as const;

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    const checkRows = (
      rows: Form6SSPZRow[],
      overrides: Partial<Record<typeof columnDefinitions[number]['key'], string>> = {}
    ) => {
      rows.forEach(row => {
        const data = getFireData(row.id);
        columnDefinitions.forEach(column => {
          const value = data[column.key as keyof SteppeFireData];
          const label = overrides[column.key] ?? column.label;
          if (value < 0) {
            errors.push({
              rowId: row.id,
              message: `Строка ${row.number}: Отрицательные значения не допускаются`,
              type: 'error'
            });
          }
          if (column.valueType === 'integer' && !Number.isInteger(value)) {
            errors.push({
              rowId: row.id,
              message: `Строка ${row.number}: показатель "${label}" должен быть целым числом`,
              type: 'error'
            });
          }
          if (column.valueType === 'decimal') {
            const precision = column.precision ?? 1;
            const multiplier = 10 ** precision;
            if (!Number.isInteger(value * multiplier)) {
              errors.push({
                rowId: row.id,
                message: `Строка ${row.number}: показатель "${label}" должен иметь точность до ${precision} знака`,
                type: 'error'
              });
            }
          }
        });
      });
    };

    checkRows(FORM_6_STEPPE_FIRES_ROWS);
    checkRows(FORM_6_IGNITIONS_ROWS, { fires_count: 'Количество загораний' });
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

  const getFireData = (rowId: string): SteppeFireData => {
    return reportData[rowId] || {
      fires_count: 0,
      steppe_area: 0,
      damage_total: 0,
      people_total: 0,
      people_dead: 0,
      people_injured: 0,
      animals_total: 0,
      animals_dead: 0,
      animals_injured: 0,
      extinguished_total: 0,
      extinguished_area: 0,
      extinguished_damage: 0,
      garrison_people: 0,
      garrison_units: 0,
      mchs_people: 0,
      mchs_units: 0
    };
  };

  const getColumnStep = (column: typeof columnDefinitions[number]) => {
    if (column.valueType === 'decimal') {
      const precision = column.precision ?? 1;
      return 1 / 10 ** precision;
    }
    return 1;
  };

  const handleExport = () => {
    const buildCsvHeader = (overrides: Partial<Record<typeof columnDefinitions[number]['key'], string>> = {}) => {
      return [
        "№ п/п",
        "Наименование области/города",
        ...columnDefinitions.map(column => overrides[column.key] ?? column.label)
      ].join(',') + "\n";
    };
    
    const flattenRows = (rows: Form6SSPZRow[], level = 0): string[] => {
      return rows.flatMap(row => {
        const data = getFireData(row.id);
        const prefix = "  ".repeat(level);
        const values = columnDefinitions.map(column => {
          const value = data[column.key as keyof SteppeFireData];
          if (column.valueType === 'decimal') {
            return value.toFixed(column.precision ?? 1);
          }
          return value;
        });
        const rowLine = `"${row.number || ''}","${prefix}${row.label}",${values.join(',')}`;
        return [rowLine];
      });
    };
    
    const table1 = ['Таблица 1. Степные пожары', buildCsvHeader().trim(), ...flattenRows(FORM_6_STEPPE_FIRES_ROWS)].join('\n');
    const table2 = [
      'Таблица 2. Загорания',
      buildCsvHeader({ fires_count: 'Количество загораний' }).trim(),
      ...flattenRows(FORM_6_IGNITIONS_ROWS)
    ].join('\n');
    const csvContent = `${table1}\n\n${table2}\n`;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form_6_sspz_${reportMonth}_${reportYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Экспорт завершен",
      description: "Форма 6-ССПЗ экспортирована в CSV"
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

    if (!period) {
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
        description: "Форма 6-ССПЗ успешно отправлена в КПС МЧС РК"
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить форму 6-ССПЗ",
        variant: "destructive"
      });
    }
  };

  const renderRow = (row: Form6SSPZRow, level = 0) => {
    const data = getFireData(row.id);

    return (
      <tr key={row.id} className="hover:bg-secondary/30">
        <td className="border border-border p-2 text-center font-medium w-16">
          {row.number}
        </td>
        <td className="border border-border p-2" style={{ paddingLeft: `${level * 20 + 8}px` }}>
          <span>{row.label}</span>
        </td>
        {columnDefinitions.map(column => (
          <td key={column.key} className="border border-border p-2 w-28">
            <Input
              type="number"
              min="0"
              step={getColumnStep(column)}
              value={data[column.key as keyof SteppeFireData] || ''}
              className="text-center"
              placeholder={column.valueType === 'decimal' ? '0.0' : '0'}
              readOnly
            />
          </td>
        ))}
      </tr>
    );
  };

  const renderRows = (rows: Form6SSPZRow[], level = 0): JSX.Element[] => {
    return rows.map(row => renderRow(row, level));
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
            <Flame className="h-5 w-5 text-orange-500 print:hidden" />
            Форма 6-ССПЗ: Сведения о степных пожарах и загораниях
          </CardTitle>
          <div className="text-sm text-muted-foreground print:text-xs">
            Приложение 6 к приказу Министра по чрезвычайным ситуациям Республики Казахстан от 28 августа 2025 года № 377
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
            <div className="flex items-end" />
          </div>

          <div className="text-center print:mt-4">
            <p className="text-sm text-muted-foreground">Форма, предназначенная для сбора административных данных</p>
            <h2 className="text-lg font-bold mt-2">СВЕДЕНИЯ О СТЕПНЫХ ПОЖАРАХ И ЗАГОРАНИЯХ</h2>
            <p className="text-sm">за _{months.find(m => m.value === reportMonth)?.label || '________'}_ месяц {reportYear} года</p>
          </div>

          <div className="overflow-x-auto print:overflow-visible">
            <div className="space-y-6">
              <div>
                <div className="font-semibold mb-2">Таблица 1. Степные пожары</div>
                <table className="w-full border-collapse border border-border text-xs">
                  <thead>
                    <tr className="bg-secondary print:bg-gray-100">
                      <th rowSpan={2} className="border border-border p-2 text-center">№ п/п</th>
                      <th rowSpan={2} className="border border-border p-2 text-left">Наименование областей и городов</th>
                      <th rowSpan={2} className="border border-border p-2 text-center">Количество пожаров</th>
                      <th rowSpan={2} className="border border-border p-2 text-center">Степная площадь (гектар)</th>
                      <th rowSpan={2} className="border border-border p-2 text-center">Общий ущерб (тысяч тенге)</th>
                      <th colSpan={3} className="border border-border p-2 text-center">Число пострадавших людей</th>
                      <th colSpan={3} className="border border-border p-2 text-center">Число пострадавших животных (голов)</th>
                      <th colSpan={5} className="border border-border p-2 text-center">
                        Ликвидировано степных пожаров акиматами и добровольными противопожарными формированиями без привлечения сил и средств гарнизона противопожарной службы
                      </th>
                      <th colSpan={2} className="border border-border p-2 text-center">
                        Привлечено сил и средств Министерства по чрезвычайным ситуациям Республики Казахстан
                      </th>
                    </tr>
                    <tr className="bg-secondary/70 text-xs">
                      <th className="border border-border p-2 text-center">всего</th>
                      <th className="border border-border p-2 text-center">погибло</th>
                      <th className="border border-border p-2 text-center">травмировано</th>
                      <th className="border border-border p-2 text-center">всего</th>
                      <th className="border border-border p-2 text-center">погибло</th>
                      <th className="border border-border p-2 text-center">травмировано</th>
                      <th className="border border-border p-2 text-center">всего</th>
                      <th className="border border-border p-2 text-center">Степная площадь (гектар)</th>
                      <th className="border border-border p-2 text-center">Общий ущерб (тысяч тенге)</th>
                      <th colSpan={2} className="border border-border p-2 text-center">сил и средств гарнизона противопожарной службы</th>
                      <th className="border border-border p-2 text-center">человек</th>
                      <th className="border border-border p-2 text-center">техники</th>
                    </tr>
                    <tr className="bg-secondary/50 text-xs">
                      <th className="border border-border p-1 text-center" />
                      <th className="border border-border p-1 text-center" />
                      {Array.from({ length: 16 }, (_, index) => (
                        <th key={index} className="border border-border p-1 text-center">
                          {index + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{renderRows(FORM_6_STEPPE_FIRES_ROWS)}</tbody>
                </table>
              </div>
              <div>
                <div className="font-semibold mb-2">Таблица 2. Загорания</div>
                <table className="w-full border-collapse border border-border text-xs">
                  <thead>
                    <tr className="bg-secondary print:bg-gray-100">
                      <th rowSpan={2} className="border border-border p-2 text-center">№ п/п</th>
                      <th rowSpan={2} className="border border-border p-2 text-left">Наименование областей и городов</th>
                      <th rowSpan={2} className="border border-border p-2 text-center">Количество загораний</th>
                      <th rowSpan={2} className="border border-border p-2 text-center">Степная площадь (гектар)</th>
                      <th rowSpan={2} className="border border-border p-2 text-center">Общий ущерб (тысяч тенге)</th>
                      <th colSpan={3} className="border border-border p-2 text-center">Число пострадавших людей</th>
                      <th colSpan={3} className="border border-border p-2 text-center">Число пострадавших животных (голов)</th>
                      <th colSpan={5} className="border border-border p-2 text-center">
                        Ликвидировано степных загораний акиматами и добровольными противопожарными формированиями без привлечения сил и средств гарнизона противопожарной службы
                      </th>
                      <th colSpan={2} className="border border-border p-2 text-center">
                        Привлечено сил и средств Министерства по чрезвычайным ситуациям Республики Казахстан
                      </th>
                    </tr>
                    <tr className="bg-secondary/70 text-xs">
                      <th className="border border-border p-2 text-center">всего</th>
                      <th className="border border-border p-2 text-center">погибло</th>
                      <th className="border border-border p-2 text-center">травмировано</th>
                      <th className="border border-border p-2 text-center">всего</th>
                      <th className="border border-border p-2 text-center">погибло</th>
                      <th className="border border-border p-2 text-center">травмировано</th>
                      <th className="border border-border p-2 text-center">всего</th>
                      <th className="border border-border p-2 text-center">Степная площадь (гектар)</th>
                      <th className="border border-border p-2 text-center">Общий ущерб (тысяч тенге)</th>
                      <th colSpan={2} className="border border-border p-2 text-center">сил и средств гарнизона противопожарной службы</th>
                      <th className="border border-border p-2 text-center">человек</th>
                      <th className="border border-border p-2 text-center">техники</th>
                    </tr>
                    <tr className="bg-secondary/50 text-xs">
                      <th className="border border-border p-1 text-center" />
                      <th className="border border-border p-1 text-center" />
                      {Array.from({ length: 16 }, (_, index) => (
                        <th key={index} className="border border-border p-1 text-center">
                          {index + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>{renderRows(FORM_6_IGNITIONS_ROWS)}</tbody>
                </table>
              </div>
            </div>
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
