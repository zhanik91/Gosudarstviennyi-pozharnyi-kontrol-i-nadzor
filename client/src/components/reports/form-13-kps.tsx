import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FORM_13_KPS_ROWS, Form13KPSRow } from "@shared/form-13-kps-rows";
import { Download, FileText, Send, Printer, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useReportForm } from "@/components/reports/use-report-form";
import { useReportPeriod } from "@/components/reports/use-report-period";
import { useQueryClient } from "@tanstack/react-query";

interface RowData {
    total: number;
    government: number;
    ngoAndIndividual: number;
    businessSmall: number;
    businessMedium: number;
    businessLarge: number;
}

export default function Form13KPS() {
    const { periodKey, reportMonth, reportYear, setReportMonth, setReportYear } = useReportPeriod();
    const [region, setRegion] = useState("Республика Казахстан (Свод)");
    const { toast } = useToast();
    const printRef = useRef<HTMLDivElement>(null);
    const period = periodKey || undefined;
    const queryClient = useQueryClient();

    const { reportData, isLoading, saveReport } = useReportForm<RowData>({
        formId: "13-kps",
        period,
        region,
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
        return (reportData as any)[rowId] || {
            total: 0,
            government: 0,
            ngoAndIndividual: 0,
            businessSmall: 0,
            businessMedium: 0,
            businessLarge: 0
        };
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

        await queryClient.invalidateQueries({ queryKey: ["/api/reports", "13-kps", period, region] });
        toast({
            title: "Данные обновлены",
            description: "Форма заполнена из журналов и реестров"
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        toast({
            title: "Экспорт",
            description: "Функция экспорта в Excel будет доступна после настройки сервера"
        });
    };

    const handleSubmit = async () => {
        try {
            await saveReport("submitted");
            toast({
                title: "Отправлено",
                description: "Отчет успешно отправлен"
            });
        } catch (e) {
            toast({
                title: "Ошибка",
                description: "Не удалось отправить отчет",
                variant: "destructive"
            });
        }
    };

    const renderRow = (row: Form13KPSRow) => {
        const data = getRowData(row.id);

        if (row.isSection) {
            return (
                <tr key={row.id} className="bg-secondary/30 font-bold print:bg-gray-200">
                    <td className="border border-border p-2 text-center text-xs">{row.number}</td>
                    <td colSpan={7} className="border border-border p-2 text-xs">{row.label}</td>
                </tr>
            );
        }

        return (
            <tr key={row.id} className="hover:bg-secondary/10">
                <td className="border border-border p-2 text-center text-[10px]">{row.number}</td>
                <td className="border border-border p-2 text-[10px] leading-tight">{row.label}</td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={data.total || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={data.government || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={data.ngoAndIndividual || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={data.businessSmall || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={data.businessMedium || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
                </td>
                <td className="border border-border p-1 w-20">
                    <Input type="number" value={data.businessLarge || ''} className="h-6 text-center text-[10px] p-0" readOnly placeholder="0" />
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

                    <div className="relative border-b pb-4 mb-4">
                        <div className="absolute top-0 right-0 font-bold text-xs">форма 13</div>
                        <div className="text-center mt-6">
                            <h2 className="text-lg font-bold uppercase tracking-tight">Сведения о контрольно-надзорной деятельности</h2>
                            <p className="text-sm mt-1 italic">за {months.find(m => m.value === reportMonth)?.label || '________'} {reportYear} года</p>
                            <p className="text-xs text-muted-foreground mt-2 font-medium">Государственный орган: {region}</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto shadow-sm border rounded-md">
                        <table className="w-full border-collapse border-slate-300">
                            <thead>
                                <tr className="bg-slate-50 print:bg-gray-100">
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-center text-[10px] w-10 font-bold uppercase">№</th>
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-left text-[10px] min-w-[300px] font-bold uppercase">показатели</th>
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-center text-[10px] w-24 font-bold uppercase bg-primary/5">Всего</th>
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-center text-[10px] w-24 font-bold uppercase">гос.организации</th>
                                    <th rowSpan={2} className="border border-slate-300 p-2 text-center text-[10px] w-32 font-bold uppercase">некоммерческие,<br />физ.лица</th>
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

                    <div className="flex flex-wrap gap-3 pt-8 print:hidden border-t">
                        <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2 hover:bg-slate-100 transition-colors">
                            <Printer className="h-4 w-4" />
                            Печать (PDF)
                        </Button>
                        <Button onClick={handleExport} variant="outline" className="flex items-center gap-2 hover:bg-slate-100 transition-colors">
                            <Download className="h-4 w-4" />
                            Экспорт Excel
                        </Button>
                        <div className="flex-grow"></div>
                        <Button onClick={handleSubmit} className="flex items-center gap-2 bg-primary shadow-lg hover:shadow-xl transition-all">
                            <Send className="h-4 w-4" />
                            Зафиксировать и отправить отчет
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
