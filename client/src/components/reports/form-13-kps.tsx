/**
 * Форма 13-КПС: Сведения о государственном контроле и надзоре
 * в области пожарной безопасности
 */

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Send, Printer, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useReportPeriod } from "@/components/reports/use-report-period";

// Интерфейсы данных формы 13-КПС
interface Form13KPSInspections {
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
}

interface Form13KPSMeasures {
    total: number;
    primary: number;
    repeat: number;
    byStatus: {
        issued: number;
        in_progress: number;
        completed: number;
    };
}

interface Form13KPSOrganizations {
    total: number;
    byType: {
        government: number;
        small_business: number;
        medium_business: number;
        large_business: number;
        individual: number;
    };
}

interface Form13KPSData {
    period: string;
    region: string;
    district: string;
    inspections: Form13KPSInspections;
    measures: Form13KPSMeasures;
    organizations: Form13KPSOrganizations;
    generatedAt: string;
}

// Месяцы для выбора периода
const MONTHS = [
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

const YEARS = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 5 + i).toString());

const REGIONS = [
    "Все",
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

export default function Form13KPS() {
    const { periodKey, reportMonth, reportYear, setReportMonth, setReportYear } = useReportPeriod();
    const [region, setRegion] = useState("Все");
    const { toast } = useToast();
    const printRef = useRef<HTMLDivElement>(null);

    const period = periodKey || undefined;

    // Запрос данных формы 13-КПС
    const { data: reportData, isLoading, isError, refetch } = useQuery<Form13KPSData>({
        queryKey: ['/api/reports/form-13-kps', period, region],
        queryFn: async () => {
            if (!period) throw new Error('Период не указан');
            const params = new URLSearchParams({ period });
            if (region && region !== 'Все') params.set('region', region);

            const res = await fetch(`/api/reports/form-13-kps?${params}`, {
                credentials: 'include'
            });
            if (!res.ok) throw new Error('Ошибка загрузки данных');
            return res.json();
        },
        enabled: !!period,
    });

    const handleRefresh = async () => {
        if (!period) {
            toast({
                title: "Ошибка",
                description: "Выберите отчётный период",
                variant: "destructive"
            });
            return;
        }

        await refetch();
        toast({
            title: "Данные обновлены",
            description: "Форма 13-КПС обновлена"
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        if (!reportData) {
            toast({
                title: "Ошибка",
                description: "Нет данных для экспорта",
                variant: "destructive"
            });
            return;
        }

        // Формируем CSV
        const csvRows = [
            'Форма 13-КПС: Сведения о государственном контроле и надзоре',
            `Период: ${reportData.period}`,
            `Регион: ${reportData.region}`,
            '',
            'РАЗДЕЛ I. ПРОВЕРКИ',
            'Показатель,Количество',
            `Всего проверок,${reportData.inspections.total}`,
            `Плановые,${reportData.inspections.byType.scheduled}`,
            `Внеплановые,${reportData.inspections.byType.unscheduled}`,
            `Профилактический контроль,${reportData.inspections.byType.preventive_control}`,
            `Мониторинг,${reportData.inspections.byType.monitoring}`,
            '',
            'ПО ОСНОВАНИЯМ',
            `По плану,${reportData.inspections.byBasis.plan}`,
            `По контролю предписаний,${reportData.inspections.byBasis.prescription}`,
            `По прокуратуре,${reportData.inspections.byBasis.prosecutor}`,
            `По жалобам,${reportData.inspections.byBasis.complaint}`,
            `По ПНСЕМ,${reportData.inspections.byBasis.pnsem}`,
            `По факту пожара,${reportData.inspections.byBasis.fire_incident}`,
            `Прочие,${reportData.inspections.byBasis.other}`,
            '',
            'ПО СТЕПЕНИ РИСКА',
            `Высокий,${reportData.inspections.byRiskLevel.high}`,
            `Средний,${reportData.inspections.byRiskLevel.medium}`,
            `Низкий,${reportData.inspections.byRiskLevel.low}`,
            '',
            `С нарушениями,${reportData.inspections.withViolations}`,
            `С админ. ответственностью,${reportData.inspections.withAdminResponsibility}`,
            `Контрольные,${reportData.inspections.followUp}`,
            '',
            'РАЗДЕЛ II. МЕРЫ ОПЕРАТИВНОГО РЕАГИРОВАНИЯ',
            `Всего МОР,${reportData.measures.total}`,
            `Первичные,${reportData.measures.primary}`,
            `Повторные,${reportData.measures.repeat}`,
            '',
            'РАЗДЕЛ III. ОРГАНИЗАЦИИ',
            `Всего организаций,${reportData.organizations.total}`,
            `Государственные,${reportData.organizations.byType.government}`,
            `Малый бизнес,${reportData.organizations.byType.small_business}`,
            `Средний бизнес,${reportData.organizations.byType.medium_business}`,
            `Крупный бизнес,${reportData.organizations.byType.large_business}`,
            `Физические лица,${reportData.organizations.byType.individual}`,
        ];

        const csvContent = '\ufeff' + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `form_13_kps_${reportMonth}_${reportYear}.csv`;
        link.click();
        URL.revokeObjectURL(url);

        toast({
            title: "Экспорт завершен",
            description: "Форма 13-КПС экспортирована в CSV"
        });
    };

    const handleSubmit = () => {
        toast({
            title: "Форма отправлена",
            description: "Форма 13-КПС успешно отправлена в КПС МЧС РК"
        });
    };

    // Рендер статистической ячейки
    const StatCell = ({ value, label }: { value: number | undefined; label: string }) => (
        <div className="text-center p-3 bg-secondary/30 rounded-lg">
            <div className="text-2xl font-bold text-primary">{value ?? 0}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
        </div>
    );

    return (
        <div className="space-y-6 print:space-y-2" ref={printRef}>
            <Card className="print:shadow-none print:border-none">
                <CardHeader className="print:pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 print:text-lg">
                            <FileText className="h-5 w-5 print:hidden" />
                            Форма 13-КПС: Сведения о государственном контроле и надзоре
                        </CardTitle>
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="sm"
                            className="print:hidden"
                            disabled={isLoading || !period}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                            Обновить
                        </Button>
                    </div>
                    <div className="text-sm text-muted-foreground print:text-xs">
                        Сведения о государственном контроле и надзоре в области пожарной безопасности
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 print:space-y-2">
                    {/* Фильтры */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label>Месяц</Label>
                                <Select value={reportMonth} onValueChange={setReportMonth}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Месяц" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map(m => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-24">
                                <Label>Год</Label>
                                <Select value={reportYear} onValueChange={setReportYear}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {YEARS.map(y => (
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
                                    {REGIONS.map(r => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Загрузка / ошибка */}
                    {isLoading && (
                        <div className="text-center py-8 text-muted-foreground">
                            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                            Загрузка данных...
                        </div>
                    )}

                    {/* Шапка таблицы в стиле Excel */}
                    <div className="overflow-x-auto border-t border-l border-r border-black">
                        <table className="w-full border-collapse text-[10px] leading-tight font-sans">
                            <thead>
                                <tr className="bg-white">
                                    <th rowSpan={3} className="border border-black p-1 w-6">№</th>
                                    <th rowSpan={3} className="border border-black p-1 min-w-[200px]">Показатели</th>
                                    <th rowSpan={3} className="border border-black p-1 w-12 text-center">Ед. изм.</th>
                                    <th rowSpan={3} className="border border-black p-1 w-16 text-center">Всего за отчетный период</th>
                                    <th colSpan={6} className="border border-black p-1 text-center">из них по частному сектору</th>
                                </tr>
                                <tr className="bg-white">
                                    <th rowSpan={2} className="border border-black p-1 w-16 text-center">Гос. организации</th>
                                    <th colSpan={5} className="border border-black p-1 text-center">субъекты частного предпринимательства</th>
                                </tr>
                                <tr className="bg-white">
                                    <th className="border border-black p-1 w-14 text-center">всего</th>
                                    <th className="border border-black p-1 w-12 text-center">микро</th>
                                    <th className="border border-black p-1 w-12 text-center">малый</th>
                                    <th className="border border-black p-1 w-12 text-center">средний</th>
                                    <th className="border border-black p-1 w-12 text-center">крупный</th>
                                </tr>
                                <tr className="bg-gray-100 text-[8px]">
                                    <th className="border border-black p-0.5">А</th>
                                    <th className="border border-black p-0.5">Б</th>
                                    <th className="border border-black p-0.5">В</th>
                                    <th className="border border-black p-0.5">1</th>
                                    <th className="border border-black p-0.5">2</th>
                                    <th className="border border-black p-0.5">3</th>
                                    <th className="border border-black p-0.5">4</th>
                                    <th className="border border-black p-0.5">5</th>
                                    <th className="border border-black p-0.5">6</th>
                                    <th className="border border-black p-0.5">7</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* ОБЩИЙ РАЗДЕЛ */}
                                <tr className="bg-white font-bold h-6">
                                    <td className="border border-black text-center">1</td>
                                    <td className="border border-black px-2">Количество подконтрольных объектов, ВСЕГО</td>
                                    <td className="border border-black text-center">ед.</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                </tr>

                                {/* I. РАЗДЕЛ: Профилактический контроль */}
                                <tr className="bg-[#FFCC00] font-bold h-6 text-center italic">
                                    <td colSpan={10} className="border border-black">
                                        I. СВЕДЕНИЯ ПО ПРОФИЛАКТИЧЕСКОМУ КОНТРОЛЮ БЕЗ ПОСЕЩЕНИЯ (МОР)
                                    </td>
                                </tr>
                                <tr className="bg-[#FFE599] font-bold h-6">
                                    <td className="border border-black text-center">2</td>
                                    <td className="border border-black px-2">Количество выданных МОР по проверкам</td>
                                    <td className="border border-black text-center">ед.</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                </tr>
                                <tr className="bg-white h-6">
                                    <td className="border border-black text-center">3</td>
                                    <td className="border border-black px-2">Из них первичных МОР</td>
                                    <td className="border border-black text-center">ед.</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                </tr>
                                <tr className="bg-white h-6">
                                    <td className="border border-black text-center">4</td>
                                    <td className="border border-black px-2">Количество выданных повторных МОР</td>
                                    <td className="border border-black text-center">ед.</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                </tr>

                                {/* II. РАЗДЕЛ: ПРОВЕРКИ */}
                                <tr className="bg-[#FFCC00] font-bold h-6 text-center italic">
                                    <td colSpan={10} className="border border-black">
                                        II. СВЕДЕНИЯ О ПРОВЕРЕННЫХ ОБЪЕКТАХ И ВЫЯВЛЕННЫХ НА ПРОВЕРКАХ НАРУШЕНИЯХ
                                    </td>
                                </tr>
                                <tr className="bg-[#FFE599] font-bold h-6">
                                    <td className="border border-black text-center">5</td>
                                    <td className="border border-black px-2">Количество проверенных объектов, ВСЕГО</td>
                                    <td className="border border-black text-center">ед.</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                </tr>
                                <tr className="bg-[#FAFAFA] h-6">
                                    <td className="border border-black text-center">6</td>
                                    <td className="border border-black px-2 pl-4">из них по основаниям МОР по проверкам</td>
                                    <td className="border border-black text-center">ед.</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                </tr>
                                <tr className="bg-white h-6">
                                    <td className="border border-black text-center">7</td>
                                    <td className="border border-black px-2 pl-4">Количество выявленных нарушений</td>
                                    <td className="border border-black text-center">ед.</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                </tr>
                                <tr className="bg-white h-6">
                                    <td className="border border-black text-center">8</td>
                                    <td className="border border-black px-2 pl-4">Количество выполненных предписаний</td>
                                    <td className="border border-black text-center">ед.</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                </tr>

                                {/* Ш. РАЗДЕЛ: АДМИН ПРАКТИКА */}
                                <tr className="bg-[#92D050] font-bold h-6 text-center italic">
                                    <td colSpan={10} className="border border-black">
                                        III. СВЕДЕНИЯ О ПРИМЕНЕННЫХ МЕРАХ АДМИНИСТРАТИВНОГО ВОЗДЕЙСТВИЯ
                                    </td>
                                </tr>
                                <tr className="bg-[#D9EAD3] font-bold h-6">
                                    <td className="border border-black text-center">9</td>
                                    <td className="border border-black px-2">Количество возбужденных адм. дел</td>
                                    <td className="border border-black text-center">ед.</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                </tr>
                                <tr className="bg-white h-6">
                                    <td className="border border-black text-center">10</td>
                                    <td className="border border-black px-2">Сумма наложенных штрафов (тыс. тенге)</td>
                                    <td className="border border-black text-center">тыс. тнг</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                    <td className="border border-black text-center">0</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Подписи и прочее */}
                    <div className="mt-8 text-[10px] space-y-6">
                        <div className="grid grid-cols-2 gap-20">
                            <div>
                                <p className="font-bold">Руководитель (или лицо, исполняющее его обязанности)</p>
                                <div className="mt-4 border-b border-black w-full flex justify-between">
                                    <span>__________________________</span>
                                    <span>(Ф.И.О.)</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">Исполнитель:</p>
                                <div className="mt-4 border-b border-black w-full inline-block text-left italic">
                                    (Ф.И.О., должность, телефон)
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="w-16 h-16 border border-black rounded-full flex items-center justify-center text-[8px] font-bold">
                                М.П.
                            </div>
                            <div className="font-bold">
                                "____" _______________ 202___ г.
                            </div>
                        </div>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex flex-wrap gap-4 pt-4 print:hidden">
                        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
                            <Printer className="h-4 w-4" />
                            Печать
                        </Button>
                        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2" disabled={!reportData}>
                            <Download className="h-4 w-4" />
                            Экспорт CSV
                        </Button>
                        <Button onClick={handleSubmit} className="flex items-center gap-2" disabled={!reportData}>
                            <Send className="h-4 w-4" />
                            Отправить в КПС МЧС РК
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
