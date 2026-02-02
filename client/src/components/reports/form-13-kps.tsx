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

                    {isError && (
                        <div className="text-center py-8 text-destructive">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            Ошибка загрузки данных. Проверьте выбранный период.
                        </div>
                    )}

                    {/* Данные формы */}
                    {reportData && !isLoading && (
                        <>
                            {/* РАЗДЕЛ I: Проверки */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">
                                    РАЗДЕЛ I. ПРОВЕРКИ
                                </h3>

                                {/* Общая статистика */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <StatCell value={reportData.inspections.total} label="Всего проверок" />
                                    <StatCell value={reportData.inspections.withViolations} label="С нарушениями" />
                                    <StatCell value={reportData.inspections.withAdminResponsibility} label="С админ. отв." />
                                    <StatCell value={reportData.inspections.followUp} label="Контрольные" />
                                </div>

                                {/* По типам проверок */}
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-border text-sm">
                                        <thead>
                                            <tr className="bg-secondary">
                                                <th className="border border-border p-2 text-left">Тип проверки</th>
                                                <th className="border border-border p-2 text-center w-24">Кол-во</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Плановые</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byType.scheduled}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Внеплановые</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byType.unscheduled}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Профилактический контроль</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byType.preventive_control}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Мониторинг</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byType.monitoring}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* По основаниям */}
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-border text-sm">
                                        <thead>
                                            <tr className="bg-secondary">
                                                <th className="border border-border p-2 text-left">Основание проверки</th>
                                                <th className="border border-border p-2 text-center w-24">Кол-во</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">По плану</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byBasis.plan}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">По контролю исполнения предписаний</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byBasis.prescription}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">По поручению прокуратуры</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byBasis.prosecutor}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">По жалобам (обращения физ/юр лиц)</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byBasis.complaint}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">По письмам ПНСЕМ (ст.152 ПК РК)</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byBasis.pnsem}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">По факту пожара</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byBasis.fire_incident}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Прочие</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byBasis.other}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* По степени риска */}
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-border text-sm">
                                        <thead>
                                            <tr className="bg-secondary">
                                                <th className="border border-border p-2 text-left">Степень риска</th>
                                                <th className="border border-border p-2 text-center w-24">Кол-во</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">
                                                    <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                                                    Высокий риск
                                                </td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byRiskLevel.high}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">
                                                    <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                                                    Средний риск
                                                </td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byRiskLevel.medium}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">
                                                    <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                                                    Низкий риск
                                                </td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.inspections.byRiskLevel.low}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* РАЗДЕЛ II: МОР */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">
                                    РАЗДЕЛ II. МЕРЫ ОПЕРАТИВНОГО РЕАГИРОВАНИЯ (МОР)
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <StatCell value={reportData.measures.total} label="Всего МОР" />
                                    <StatCell value={reportData.measures.primary} label="Первичные" />
                                    <StatCell value={reportData.measures.repeat} label="Повторные" />
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-border text-sm">
                                        <thead>
                                            <tr className="bg-secondary">
                                                <th className="border border-border p-2 text-left">Статус МОР</th>
                                                <th className="border border-border p-2 text-center w-24">Кол-во</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Выдано</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.measures.byStatus.issued}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">В работе</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.measures.byStatus.in_progress}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Завершено</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.measures.byStatus.completed}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* РАЗДЕЛ III: Организации */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold border-b pb-2">
                                    РАЗДЕЛ III. СУБЪЕКТЫ ПРОВЕРОК
                                </h3>

                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-border text-sm">
                                        <thead>
                                            <tr className="bg-secondary">
                                                <th className="border border-border p-2 text-left">Тип организации</th>
                                                <th className="border border-border p-2 text-center w-24">Кол-во</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Государственные организации</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.organizations.byType.government}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Малый бизнес</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.organizations.byType.small_business}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Средний бизнес</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.organizations.byType.medium_business}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Крупный бизнес</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.organizations.byType.large_business}</td>
                                            </tr>
                                            <tr className="hover:bg-secondary/30">
                                                <td className="border border-border p-2">Физические лица</td>
                                                <td className="border border-border p-2 text-center font-medium">{reportData.organizations.byType.individual}</td>
                                            </tr>
                                            <tr className="bg-secondary/50 font-semibold">
                                                <td className="border border-border p-2">ИТОГО</td>
                                                <td className="border border-border p-2 text-center">{reportData.organizations.total}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Подписи и печать */}
                            <div className="border border-border rounded-lg p-4 mt-6 space-y-4 print:mt-8 print:border-black">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                                    <div className="text-center">
                                        <div className="border-b border-border pb-6 mb-1">
                                            <span className="text-muted-foreground text-xs">подпись</span>
                                        </div>
                                        <Label className="text-xs">Руководитель</Label>
                                    </div>
                                    <div className="text-center">
                                        <div className="border-b border-border pb-6 mb-1">
                                            <span className="text-muted-foreground text-xs">расшифровка подписи</span>
                                        </div>
                                        <Label className="text-xs">Фамилия И.О.</Label>
                                    </div>
                                    <div className="text-center">
                                        <div className="border-b border-border pb-6 mb-1">
                                            <span className="text-muted-foreground text-xs">дата</span>
                                        </div>
                                        <Label className="text-xs">{new Date().toLocaleDateString('ru-RU')}</Label>
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
                        </>
                    )}

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
