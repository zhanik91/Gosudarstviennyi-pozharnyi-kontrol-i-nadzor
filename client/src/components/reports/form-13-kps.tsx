/**
 * Форма 13-КПС: Сведения о государственном контроле и надзоре
 * в области пожарной безопасности
 */

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FORM_13_KPS_ROWS, Form13KPSRow } from "@shared/form-13-kps-rows";
import { Download, FileText, Send, Printer, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReportPeriod } from "@/components/reports/use-report-period";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Интерфейс данных API формы 13-КПС
interface Form13KPSApiData {
    period: string;
    region: string;
    district: string;
    inspections: {
        total: number;
        byType: {
            scheduled: number;
            unscheduled: number;
            preventive_control: number;
            monitoring: number;
        };
        byBasis: {
            plan: number;
            prescription: number;
            prosecutor: number;
            complaint: number;
            pnsem: number;
            fire_incident: number;
            other: number;
        };
        byRiskLevel: {
            high: number;
            medium: number;
            low: number;
        };
        withViolations: number;
        withAdminResponsibility: number;
        followUp: number;
    };
    measures: {
        total: number;
        primary: number;
        repeat: number;
        byStatus: {
            issued: number;
            in_progress: number;
            completed: number;
        };
    };
    organizations: {
        total: number;
        byType: {
            government: number;
            small_business: number;
            medium_business: number;
            large_business: number;
            individual: number;
        };
    };
    generatedAt: string;
}

export default function Form13KPS() {
    const { periodKey, reportMonth, reportYear, setReportMonth, setReportYear } = useReportPeriod();
    const [region, setRegion] = useState("Республика Казахстан (Свод)");
    const { toast } = useToast();
    const printRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const period = periodKey || undefined;

    // Прямой запрос к API формы 13-КПС
    const { data: apiData, isLoading, isError, error, refetch } = useQuery<Form13KPSApiData>({
        queryKey: ['/api/reports/form-13-kps', period, region],
        queryFn: async () => {
            if (!period) throw new Error('Период не указан');
            const params = new URLSearchParams({ period });
            if (region && region !== 'Республика Казахстан (Свод)') {
                params.set('region', region);
            }
            console.log('[Form13KPS] Fetching:', `/api/reports/form-13-kps?${params.toString()}`);
            const res = await fetch(`/api/reports/form-13-kps?${params}`, {
                credentials: 'include'
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Ошибка загрузки данных');
            }
            const data = await res.json();
            console.log('[Form13KPS] API Response:', data);
            return data;
        },
        enabled: !!period,
    });

    // Функция для получения значения ячейки на основе ID строки
    const getCellValue = (rowId: string, column: 'total' | 'government' | 'ngoAndIndividual' | 'businessSmall' | 'businessMedium' | 'businessLarge'): number => {
        if (!apiData) return 0;

        const { inspections, measures, organizations } = apiData;

        // Маппинг показателей на данные API
        // Строки 4-8: Общие сведения
        if (rowId === '5') {
            // Количество объектов на учете
            if (column === 'total') return organizations.total;
            if (column === 'government') return organizations.byType.government;
            if (column === 'ngoAndIndividual') return organizations.byType.individual;
            if (column === 'businessSmall') return organizations.byType.small_business;
            if (column === 'businessMedium') return organizations.byType.medium_business;
            if (column === 'businessLarge') return organizations.byType.large_business;
        }

        if (rowId === '6') {
            // Высокая степень риска (пока считаем все как total)
            if (column === 'total') return inspections.byRiskLevel.high;
        }
        if (rowId === '7') {
            if (column === 'total') return inspections.byRiskLevel.medium;
        }
        if (rowId === '8') {
            if (column === 'total') return inspections.byRiskLevel.low;
        }

        // Строка 10: Количество проверенных объектов, ВСЕГО
        if (rowId === 'row-10') {
            if (column === 'total') return inspections.total;
        }

        // Строка 11: из них применено МОР
        if (rowId === 'row-11') {
            if (column === 'total') return measures.total;
        }

        // Строка 12: Количество нарушений МОР
        if (rowId === 'row-12') {
            if (column === 'total') return inspections.withViolations;
        }

        // Строка 13: Количество объектов, полностью исполнивших МОР
        if (rowId === 'row-13') {
            if (column === 'total') return measures.byStatus.completed;
        }

        // Строка 14: МОР повторно
        if (rowId === 'row-14') {
            if (column === 'total') return measures.repeat;
        }

        // Строка 16: Объекты, охваченные профилактическим контролем
        if (rowId === 'row-16') {
            if (column === 'total') return inspections.byType.preventive_control;
        }

        // Строка 24: Внеплановые проверки
        if (rowId === 'row-24') {
            if (column === 'total') return inspections.byType.unscheduled;
        }

        // Строка 25: По контролю исполнения предписаний
        if (rowId === 'row-25') {
            if (column === 'total') return inspections.byBasis.prescription;
        }

        // Строка 33: По поручению прокуратуры
        if (rowId === 'row-33') {
            if (column === 'total') return inspections.byBasis.prosecutor;
        }

        // Строка 40: По жалобам
        if (rowId === 'row-40') {
            if (column === 'total') return inspections.byBasis.complaint;
        }

        // Строка 48: Контрольная проверка
        if (rowId === 'row-48') {
            if (column === 'total') return inspections.followUp;
        }

        // Раздел I.I (Высокая) - строки 53-92
        if (rowId === 'row-53') {
            if (column === 'total') return inspections.byRiskLevel.high;
        }

        // Раздел I.II (Средняя) - строки 94-133
        if (rowId === 'row-94') {
            if (column === 'total') return inspections.byRiskLevel.medium;
        }

        // Раздел I.III (Низкая) - строки 135-165
        if (rowId === 'row-135') {
            if (column === 'total') return inspections.byRiskLevel.low;
        }

        return 0;
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

        await queryClient.invalidateQueries({ queryKey: ['/api/reports/form-13-kps', period, region] });
        await refetch();
        toast({
            title: "Данные обновлены",
            description: "Форма 13-КПС обновлена из журналов"
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

    const renderRow = (row: Form13KPSRow) => {
        if (row.isSection) {
            return (
                <tr key={row.id} className="bg-secondary/30 font-bold print:bg-gray-200">
                    <td className="border border-border p-2 text-center text-xs">{row.number}</td>
                    <td colSpan={7} className="border border-border p-2 text-xs">{row.label}</td>
                </tr>
            );
        }

        const total = getCellValue(row.id, 'total');
        const government = getCellValue(row.id, 'government');
        const ngoAndIndividual = getCellValue(row.id, 'ngoAndIndividual');
        const businessSmall = getCellValue(row.id, 'businessSmall');
        const businessMedium = getCellValue(row.id, 'businessMedium');
        const businessLarge = getCellValue(row.id, 'businessLarge');

        return (
            <tr key={row.id} className="hover:bg-secondary/10">
                <td className="border border-border p-2 text-center text-[10px]">{row.number}</td>
                <td className="border border-border p-2 text-[10px] leading-tight">{row.label}</td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={total || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={government || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={ngoAndIndividual || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={businessSmall || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={businessMedium || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={businessLarge || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
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

    return (
        <div className="space-y-6 print:space-y-2" ref={printRef}>
            <Card className="print:shadow-none print:border-none max-w-[1200px] mx-auto overflow-hidden">
                <CardHeader className="print:pb-2 bg-secondary/10 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 print:text-lg text-xl font-bold">
                            <FileText className="h-6 w-6 print:hidden text-primary" />
                            Форма 13-КПС
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
                            ✅ Данные загружены: {apiData.inspections.total} проверок, {apiData.measures.total} МОР, {apiData.organizations.total} организаций
                        </div>
                    )}

                    {/* Заголовок формы */}
                    <div className="relative border-b pb-4 mb-4">
                        <div className="absolute top-0 right-0 font-bold text-xs">форма 13</div>
                        <div className="text-center mt-6">
                            <h2 className="text-lg font-bold uppercase tracking-tight">Сведения о контрольно-надзорной деятельности</h2>
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
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-left text-[10px] min-w-[300px] font-bold uppercase">показатели</th>
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
                                {FORM_13_KPS_ROWS.map(row => renderRow(row))}
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
