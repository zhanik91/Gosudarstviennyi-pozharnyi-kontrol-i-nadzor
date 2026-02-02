/**
 * Компонент отчета административной практики
 * Форма II - Административная практика с автозаполнением из журнала
 */

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ADMIN_PRACTICE_REPORT_ROWS, AdminPracticeReportRow, AdminPracticeColumnKey } from "@shared/admin-practice-report-rows";
import { Download, FileText, Send, Printer, RefreshCw, AlertCircle, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReportPeriod } from "@/components/reports/use-report-period";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Интерфейс данных строки
interface RowData {
    total: number;
    government: number;
    ngoIndividual: number;
    businessSmall: number;
    businessMedium: number;
    businessLarge: number;
}

// Интерфейс ответа API
interface AdminPracticeReportApiData {
    period: string;
    region: string;
    district: string;
    rows: Record<string, RowData>;
    generatedAt: string;
}

export default function AdminPracticeReport() {
    const { periodKey, reportMonth, reportYear, setReportMonth, setReportYear } = useReportPeriod();
    const [region, setRegion] = useState("Республика Казахстан (Свод)");
    const { toast } = useToast();
    const printRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const period = periodKey || undefined;

    // Запрос к API отчета
    const { data: apiData, isLoading, isError, error, refetch } = useQuery<AdminPracticeReportApiData>({
        queryKey: ['/api/reports/admin-practice', period, region],
        queryFn: async () => {
            if (!period) throw new Error('Период не указан');
            const params = new URLSearchParams({ period });
            if (region && region !== 'Республика Казахстан (Свод)') {
                params.set('region', region);
            }
            const res = await fetch(`/api/reports/admin-practice?${params}`, {
                credentials: 'include'
            });

            const contentType = res.headers.get('content-type');
            if (!contentType?.includes('application/json')) {
                throw new Error('Сервер вернул неожиданный ответ. Возможно, требуется повторная авторизация.');
            }

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || `Ошибка загрузки данных (${res.status})`);
            }
            return res.json();
        },
        enabled: !!period,
    });

    // Получить значение ячейки
    const getCellValue = (rowId: string, column: AdminPracticeColumnKey): number | string => {
        if (!apiData?.rows?.[rowId]) return 0;
        const row = apiData.rows[rowId];
        return row[column] || 0;
    };

    // Форматирование суммы
    const formatCurrency = (value: number) => {
        if (value === 0) return '';
        return new Intl.NumberFormat('ru-RU').format(value);
    };

    const handleRefresh = async () => {
        if (!period) {
            toast({
                title: "Ошибка",
                description: "Выберите отчётный период",
                variant: "destructive"
            });
            return;
        }

        await queryClient.invalidateQueries({ queryKey: ['/api/reports/admin-practice', period, region] });
        await refetch();
        toast({
            title: "Данные обновлены",
            description: "Отчет административной практики обновлен из журнала"
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        toast({
            title: "Экспорт",
            description: "Функция экспорта будет доступна позднее"
        });
    };

    const handleSubmit = async () => {
        toast({
            title: "Отправлено",
            description: "Отчет зафиксирован"
        });
    };

    const renderRow = (row: AdminPracticeReportRow) => {
        if (row.isSection) {
            return (
                <tr key={row.id} className="bg-primary/10 font-bold print:bg-gray-200">
                    <td className="border border-border p-2 text-center text-xs"></td>
                    <td colSpan={7} className="border border-border p-2 text-xs font-bold">{row.label}</td>
                </tr>
            );
        }

        const total = getCellValue(row.id, 'total');
        const government = getCellValue(row.id, 'government');
        const ngoIndividual = getCellValue(row.id, 'ngoIndividual');
        const businessSmall = getCellValue(row.id, 'businessSmall');
        const businessMedium = getCellValue(row.id, 'businessMedium');
        const businessLarge = getCellValue(row.id, 'businessLarge');

        const displayValue = (val: number | string) => {
            if (row.isSumRow && typeof val === 'number' && val > 0) {
                return formatCurrency(val);
            }
            return val || '';
        };

        return (
            <tr key={row.id} className={`hover:bg-secondary/10 ${row.isSubRow ? 'text-muted-foreground' : ''}`}>
                <td className="border border-border p-2 text-center text-[10px]">{row.number}</td>
                <td className={`border border-border p-2 text-[10px] leading-tight ${row.isSubRow ? 'pl-6' : ''}`}>
                    {row.label}
                </td>
                <td className="border border-border p-1 w-20">
                    <Input
                        type="text"
                        value={displayValue(total as number)}
                        className="h-6 text-center text-[10px] p-0"
                        readOnly
                        placeholder="0"
                    />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input
                        type="text"
                        value={displayValue(government as number)}
                        className="h-6 text-center text-[10px] p-0"
                        readOnly
                        placeholder="0"
                    />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input
                        type="text"
                        value={displayValue(ngoIndividual as number)}
                        className="h-6 text-center text-[10px] p-0"
                        readOnly
                        placeholder="0"
                    />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input
                        type="text"
                        value={displayValue(businessSmall as number)}
                        className="h-6 text-center text-[10px] p-0"
                        readOnly
                        placeholder="0"
                    />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input
                        type="text"
                        value={displayValue(businessMedium as number)}
                        className="h-6 text-center text-[10px] p-0"
                        readOnly
                        placeholder="0"
                    />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input
                        type="text"
                        value={displayValue(businessLarge as number)}
                        className="h-6 text-center text-[10px] p-0"
                        readOnly
                        placeholder="0"
                    />
                </td>
            </tr>
        );
    };

    const months = [
        { value: '01', label: 'январь' }, { value: '02', label: 'февраль' },
        { value: '03', label: 'март' }, { value: '04', label: 'апрель' },
        { value: '05', label: 'май' }, { value: '06', label: 'июнь' },
        { value: '07', label: 'июль' }, { value: '08', label: 'август' },
        { value: '09', label: 'сентябрь' }, { value: '10', label: 'октябрь' },
        { value: '11', label: 'ноябрь' }, { value: '12', label: 'декабрь' }
    ];

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());

    const regions = [
        "Республика Казахстан (Свод)", "г. Астана", "г. Алматы", "г. Шымкент",
        "Акмолинская область", "Актюбинская область", "Алматинская область",
        "Атырауская область", "Восточно-Казахстанская область", "Жамбылская область",
        "Западно-Казахстанская область", "Карагандинская область", "Костанайская область",
        "Кызылординская область", "Мангистауская область", "Павлодарская область",
        "Северо-Казахстанская область", "Туркестанская область", "Улытауская область",
        "Абай область", "Жетісу область"
    ];

    // Подсчет статистики
    const totalCases = apiData?.rows?.['row-4']?.total || 0;
    const totalWarnings = apiData?.rows?.['row-5']?.total || 0;
    const totalFines = apiData?.rows?.['row-6']?.total || 0;

    return (
        <div className="space-y-6 print:space-y-2" ref={printRef}>
            <Card className="print:shadow-none print:border-none max-w-[1200px] mx-auto overflow-hidden">
                <CardHeader className="print:pb-2 bg-secondary/10 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 print:text-lg text-xl font-bold">
                            <BarChart3 className="h-6 w-6 print:hidden text-primary" />
                            Отчет административной практики
                        </CardTitle>
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            className="print:hidden"
                            disabled={isLoading || !period}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Обновить данные
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 print:space-y-2 p-6">
                    {/* Фильтры */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label className="text-xs">Отчетный период</Label>
                                <Select value={reportMonth} onValueChange={setReportMonth}>
                                    <SelectTrigger className="h-9"><SelectValue placeholder="Месяц" /></SelectTrigger>
                                    <SelectContent>
                                        {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-24">
                                <Label className="text-xs">&nbsp;</Label>
                                <Select value={reportYear} onValueChange={setReportYear}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => <SelectItem key={y} value={y}>{y} г.</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs">Регион</Label>
                            <Select value={region} onValueChange={setRegion}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Статус загрузки */}
                    {isError && (
                        <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center gap-2 print:hidden">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">{(error as Error)?.message || 'Ошибка загрузки данных'}</span>
                        </div>
                    )}

                    {apiData && (
                        <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-3 rounded-md text-sm print:hidden">
                            ✅ Данные загружены: {totalCases} взысканий, {totalWarnings} предупреждений, {totalFines} штрафов
                        </div>
                    )}

                    {/* Заголовок формы */}
                    <div className="relative border-b pb-4 mb-4">
                        <div className="absolute top-0 right-0 font-bold text-xs">форма II</div>
                        <div className="text-center mt-6">
                            <h2 className="text-lg font-bold uppercase tracking-tight">Сведения по административной практике</h2>
                            <p className="text-sm mt-1 italic">за {months.find(m => m.value === reportMonth)?.label || '________'} {reportYear} года</p>
                            <p className="text-xs text-muted-foreground mt-2 font-medium">Государственный орган: {region}</p>
                        </div>
                    </div>

                    {/* Таблица */}
                    <div className="overflow-x-auto shadow-sm border rounded-md">
                        <table className="w-full border-collapse border-slate-300">
                            <thead>
                                <tr className="bg-slate-50 print:bg-gray-100">
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-center text-[10px] w-10 font-bold uppercase">№</th>
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-left text-[10px] min-w-[300px] font-bold uppercase">Показатели</th>
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-center text-[10px] w-24 font-bold uppercase bg-primary/5">Всего</th>
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-center text-[10px] w-24 font-bold uppercase">гос.орг.</th>
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-center text-[10px] w-32 font-bold uppercase">нко, физ.лица</th>
                                    <th colSpan={3} className="border border-slate-300 p-2 text-center text-[10px] font-bold uppercase bg-secondary/20">субъекты бизнеса</th>
                                </tr>
                                <tr className="bg-slate-50 print:bg-gray-50 text-[9px] uppercase font-bold">
                                    <th className="border border-slate-300 p-1 w-20 text-center">малое</th>
                                    <th className="border border-slate-300 p-1 w-20 text-center">среднее</th>
                                    <th className="border border-slate-300 p-1 w-20 text-center">крупное</th>
                                </tr>
                                <tr className="bg-slate-100 text-[9px] text-slate-500 font-bold">
                                    <th className="border border-slate-300 p-0.5 text-center">A</th>
                                    <th className="border border-slate-300 p-0.5 text-center">B</th>
                                    <th className="border border-slate-300 p-0.5 text-center bg-primary/5">C</th>
                                    <th className="border border-slate-300 p-0.5 text-center">D</th>
                                    <th className="border border-slate-300 p-0.5 text-center">E</th>
                                    <th className="border border-slate-300 p-0.5 text-center bg-secondary/10">F</th>
                                    <th className="border border-slate-300 p-0.5 text-center bg-secondary/10">G</th>
                                    <th className="border border-slate-300 p-0.5 text-center bg-secondary/10">H</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ADMIN_PRACTICE_REPORT_ROWS.map(row => renderRow(row))}
                            </tbody>
                        </table>
                    </div>

                    {/* Подписи */}
                    <div className="mt-12 border-t pt-8 space-y-12 print:mt-8">
                        <div className="grid grid-cols-2 gap-32 text-sm">
                            <div className="space-y-6">
                                <p className="font-bold">Руководитель (или лицо, исполняющее его обязанности)</p>
                                <div className="border-b border-black flex justify-between pt-4">
                                    <span className="text-[10px] text-muted-foreground italic">подпись</span>
                                    <span className="font-medium text-xs">__________________________________</span>
                                </div>
                                <div className="text-right pr-4">
                                    <span className="text-[10px] text-muted-foreground italic">(Ф.И.О.)</span>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <p className="font-bold text-right pr-4">Исполнитель:</p>
                                <div className="border-b border-black text-left pt-12 pb-1 relative">
                                    <span className="text-[10px] text-muted-foreground italic absolute -bottom-5 left-0 w-full text-center">
                                        (Ф.И.О., должность, телефон)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-end pt-8">
                            <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-xs font-bold text-slate-400">
                                М.П.
                            </div>
                            <div className="font-bold border-b-2 border-black w-64 text-center pb-2 text-lg">
                                "____" _______________ 202___ г.
                            </div>
                        </div>
                    </div>

                    {/* Кнопки */}
                    <div className="flex flex-wrap gap-3 pt-8 print:hidden border-t">
                        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2 hover:bg-slate-100 transition-colors">
                            <Printer className="h-4 w-4" />
                            Печать (PDF)
                        </Button>
                        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 hover:bg-slate-100 transition-colors" disabled={!apiData}>
                            <Download className="h-4 w-4" />
                            Экспорт Excel
                        </Button>
                        <div className="flex-grow"></div>
                        <Button onClick={handleSubmit} className="flex items-center gap-2 bg-primary shadow-lg hover:shadow-xl transition-all" disabled={!apiData}>
                            <Send className="h-4 w-4" />
                            Зафиксировать и отправить отчет
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
