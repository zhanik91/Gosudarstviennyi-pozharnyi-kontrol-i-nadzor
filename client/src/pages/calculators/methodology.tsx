import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, ShieldCheck, Info } from "lucide-react";
import { Link } from "wouter";

export default function ExtinguisherMethodology() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
                <Link href="/calculators/fire-extinguishers">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Назад к калькулятору
                    </Button>
                </Link>
            </div>

            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
                    <BookOpen className="w-8 h-8 text-red-500" />
                    Методика расчета огнетушителей
                </h1>
                <p className="text-muted-foreground mt-2">
                    Нормативно-правовая база Республики Казахстан (ППБ РК и СТ РК)
                </p>
            </div>

            <div className="space-y-8">
                {/* Section 1: PPB RK */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <ShieldCheck className="w-6 h-6 text-emerald-500" />
                        <h2 className="text-xl font-bold">Правила пожарной безопасности (ППБ РК)</h2>
                    </div>
                    <p className="text-sm text-muted-foreground italic">Приложение 3 к Правилам пожарной безопасности (Приказ МЧС РК №55)</p>

                    <Card className="bg-slate-50 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-md">Пункт 13. Учет АУПТ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed">
                                Допускается уменьшение количества переносных огнетушителей (за исключением общественных зданий) на 50% от расчетного, если здание оборудовано автоматическими установками пожаротушения (АУПТ).
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-md">Пункт 8. Минимальное количество на этаж</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed">
                                На каждом этаже зданий и сооружений должно быть размещено не менее двух переносных огнетушителей.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-50 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-md">Пункт 1471. Огневые работы</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed">
                                Места проведения огневых работ обеспечиваются первичными средствами пожаротушения: на каждые 100 м² площади – не менее 2 переносных огнетушителей и противопожарное полотно (кошма).
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Section 2: Tables */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <Info className="w-6 h-6 text-blue-500" />
                        <h2 className="text-xl font-bold">Нормативы оснащения (Таблица 1)</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-slate-200">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="border p-2 text-left">Категория / Тип</th>
                                    <th className="border p-2 text-center">Пл. блока (м²)</th>
                                    <th className="border p-2 text-center">Норма (шт.)</th>
                                    <th className="border p-2 text-center">Расстояние (м)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border p-2">А, Б, В (горючие газы/жидкости)</td>
                                    <td className="border p-2 text-center">200</td>
                                    <td className="border p-2 text-center">2</td>
                                    <td className="border p-2 text-center">30</td>
                                </tr>
                                <tr>
                                    <td className="border p-2">В (твердые материалы)</td>
                                    <td className="border p-2 text-center">400</td>
                                    <td className="border p-2 text-center">2</td>
                                    <td className="border p-2 text-center">30</td>
                                </tr>
                                <tr>
                                    <td className="border p-2">Г (умеренная пожароопасность)</td>
                                    <td className="border p-2 text-center">1600</td>
                                    <td className="border p-2 text-center">2</td>
                                    <td className="border p-2 text-center">40</td>
                                </tr>
                                <tr>
                                    <td className="border p-2">Д (пониженная пожароопасность)</td>
                                    <td className="border p-2 text-center">1800</td>
                                    <td className="border p-2 text-center">2</td>
                                    <td className="border p-2 text-center">70</td>
                                </tr>
                                <tr>
                                    <td className="border p-2">Общественные здания</td>
                                    <td className="border p-2 text-center">800</td>
                                    <td className="border p-2 text-center">4 (2 ОП)</td>
                                    <td className="border p-2 text-center">20</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Section 3: ST RK */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                        <ShieldCheck className="w-6 h-6 text-slate-500" />
                        <h2 className="text-xl font-bold">СТ РК 1487-2006</h2>
                    </div>
                    <Card className="bg-slate-50 border-none shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-md">Пункт 8.5. Резерв на ТО</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm leading-relaxed">
                                Для обеспечения надежной защиты объектов на время технического обслуживания (перезарядки) огнетушителей предусматривается резерв в количестве не менее 10% от общего числа огнетушителей на объекте.
                            </p>
                        </CardContent>
                    </Card>
                </section>
            </div>

            <div className="mt-12 text-center text-xs text-muted-foreground">
                Данный справочник носит информационный характер и не заменяет собой официальный текст НПА.
            </div>
        </div>
    );
}
