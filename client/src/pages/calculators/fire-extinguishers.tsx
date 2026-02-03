import { useState, useMemo } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calculator,
  RefreshCw,
  FileDown,
  AlertTriangle,
  CheckCircle,
  Shield,
  Layers,
  Info,
  ExternalLink,
  Flame,
  Construction
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CalculationResult {
  powderCount: number;
  co2Count: number;
  waterCount: number;
  mobileCount: number;
  reserveCount: number;
  totalPortable: number;
  totalCount: number;
  perFloor: number[];
  reasons: { label: string; text: string; link?: string }[];
  warnings: string[];
  maxDistance: number;
}

type ExtCategory = "A" | "B" | "V_GAS" | "V_SOLID" | "G" | "D" | "PUBLIC" | "FIRE_WORKS";

const CATEGORY_DATA: Record<ExtCategory, {
  label: string;
  blockArea: number;
  powderNorm: number;
  distance: number;
  mobileThreshold?: number;
}> = {
  "A": { label: "А — повышенная взрывопожароопасность", blockArea: 200, powderNorm: 2, distance: 30, mobileThreshold: 500 },
  "B": { label: "Б — взрывопожароопасность", blockArea: 200, powderNorm: 2, distance: 30, mobileThreshold: 500 },
  "V_GAS": { label: "В — пожароопасность (горючие газы/жидкости)", blockArea: 200, powderNorm: 2, distance: 30, mobileThreshold: 500 },
  "V_SOLID": { label: "В — пожароопасность (твердые материалы)", blockArea: 400, powderNorm: 2, distance: 30, mobileThreshold: 800 },
  "G": { label: "Г — умеренная пожароопасность", blockArea: 1600, powderNorm: 2, distance: 40, mobileThreshold: 1600 },
  "D": { label: "Д — пониженная пожароопасность", blockArea: 1800, powderNorm: 2, distance: 70 },
  "PUBLIC": { label: "Общественные и административные здания", blockArea: 800, powderNorm: 2, distance: 20 },
  "FIRE_WORKS": { label: "Огневые работы (временные)", blockArea: 100, powderNorm: 2, distance: 20 },
};

export default function FireExtinguisherCalculator() {
  const [area, setArea] = useState("");
  const [category, setCategory] = useState<ExtCategory | "">("");
  const [floors, setFloors] = useState("1");
  const [hasAUPT, setHasAUPT] = useState(false);
  const [hasElectrical, setHasElectrical] = useState(false);
  const [hasCabinets, setHasCabinets] = useState(false);
  const [reservePercent, setReservePercent] = useState("10");

  const result = useMemo<CalculationResult | null>(() => {
    if (!area || !category) return null;

    const S = parseFloat(area);
    const N = Math.max(1, parseInt(floors) || 1);
    const data = CATEGORY_DATA[category as ExtCategory];
    const reservePct = Math.max(0, parseFloat(reservePercent) || 0);

    if (S <= 0) return null;

    // Специальное правило для Кат Д <= 100м2
    if (category === "D" && S <= 100) {
      return {
        powderCount: 0, co2Count: 0, waterCount: 0, mobileCount: 0, reserveCount: 0,
        totalPortable: 0, totalCount: 0, perFloor: [],
        reasons: [{ label: "Исключение", text: "Для помещений категории Д площадью до 100 м² огнетушители не требуются (ППБ РК, Прил. 3, п. 9)." }],
        warnings: [], maxDistance: 70
      };
    }

    // 1. Расчет переносных (Блочный принцип: за каждый полный или неполный блок)
    const blocks = Math.ceil(S / data.blockArea);
    let portableQty = blocks * data.powderNorm;

    const reasons: { label: string; text: string; link?: string }[] = [];
    reasons.push({
      label: "Базовый расчет",
      text: `Для площади ${S} м² требуется ${portableQty} шт. (основано на норме ${data.powderNorm} шт. на каждые ${data.blockArea} м² для выбранной категории, Табл. 1 Прил. 3 к ППБ РК).`
    });

    // 2. Учет АУПТ
    if (hasAUPT) {
      const oldQty = portableQty;
      portableQty = Math.round(portableQty * 0.5);
      reasons.push({
        label: "Скидка АУПТ",
        text: `Количество сокращено на 50% (${oldQty} → ${portableQty}) в связи с наличием автоматического пожаротушения (Прил. 3 к ППБ РК, п. 13).`
      });
    }

    // 3. Минимум на этаж
    const minRequired = N * 2;
    if (portableQty < minRequired) {
      portableQty = minRequired;
      reasons.push({
        label: "Минимальная норма",
        text: `Установлено минимальное количество: 2 шт. на каждый этаж (всего ${minRequired} шт. для ${N} эт.), согласно Прил. 3 к ППБ РК.`
      });
    }

    // 4. Распределение типов
    let co2Count = 0;
    let powderCount = portableQty;
    if (hasElectrical) {
      co2Count = Math.max(1, Math.round(portableQty * 0.2)); // 20% но не меньше 1
      if (co2Count > portableQty) co2Count = portableQty;
      powderCount = portableQty - co2Count;
      reasons.push({
        label: "Типы огнетушителей",
        text: `Рекомендуется выделить ${co2Count} шт. углекислотных (ОУ) для защиты электрооборудования.`
      });
    }

    // 5. Передвижные
    let mobileCount = 0;
    if (data.mobileThreshold && S > data.mobileThreshold) {
      mobileCount = 1 + Math.ceil((S - data.mobileThreshold) / 1000);
      reasons.push({
        label: "Передвижные ОТ",
        text: `Требуется ${mobileCount} шт. передвижных огнетушителей (ОП-50) исходя из площади объекта > ${data.mobileThreshold} м² (Таблица 2 Прил. 3 к ППБ РК).`
      });
    }

    // 6. Резерв
    const reserveCount = Math.ceil(portableQty * (reservePct / 100));
    if (reservePct > 0) {
      reasons.push({
        label: "Резерв",
        text: `Предусмотрено ${reserveCount} шт. резервных огнетушителей (${reservePct}%) для замены на время ТО (СТ РК 1487-2006 п. 8.5).`
      });
    }

    // Распределение по этажам
    const perFloorArr = Array(N).fill(0);
    for (let i = 0; i < portableQty; i++) {
      perFloorArr[i % N] += 1;
    }

    // Предупреждения
    const warnings = [];
    if (hasCabinets) {
      warnings.push("В каждом пожарном шкафу (ПК) должно быть размещено не менее 2-х огнетушителей (Прил. 3 к ППБ РК, п. 14).");
    }
    if (category === "A" || category === "B") {
      warnings.push("Для категорий А и Б требуется применение взрывозащищенного оборудования.");
    }
    if (category === "FIRE_WORKS") {
      warnings.push("Дополнительно требуется наличие ящика с песком и лопатой (п. 1471 ППБ РК).");
    }

    return {
      powderCount, co2Count, waterCount: 0, mobileCount, reserveCount,
      totalPortable: portableQty,
      totalCount: portableQty + mobileCount + reserveCount,
      perFloor: perFloorArr,
      reasons,
      warnings,
      maxDistance: data.distance
    };
  }, [area, category, floors, hasAUPT, hasElectrical, hasCabinets, reservePercent]);

  const reset = () => {
    setArea(""); setCategory(""); setFloors("1");
    setHasAUPT(false); setHasElectrical(false); setHasCabinets(false);
    setReservePercent("10");
  };

  const exportResult = () => {
    if (!result) return;
    const content = `ОТЧЕТ ПО РАСЧЕТУ ПЕРВИЧНЫХ СРЕДСТВ ПОЖАРОТУШЕНИЯ
--------------------------------------------------
Дата: ${new Date().toLocaleDateString("ru-RU")}
Объект: ${CATEGORY_DATA[category as ExtCategory]?.label}
Площадь: ${area} м² | Этажность: ${floors}

РЕЗУЛЬТАТЫ:
- Переносные порошковые (ОП-4/5): ${result.powderCount} шт.
- Переносные углекислотные (ОУ-5): ${result.co2Count} шт.
- Передвижные (ОП-50): ${result.mobileCount} шт.
- Резерв на ТО: ${result.reserveCount} шт.
- Макс. расстояние до ОТ: ${result.maxDistance} м.

ОБОСНОВАНИЯ:
${result.reasons.map(r => `[${r.label}] ${r.text}`).join("\n")}

ПРЕДУПРЕЖДЕНИЯ:
${result.warnings.map(w => `! ${w}`).join("\n")}

Основание: ППБ РК (Приложение 3), СТ РК 1487-2006.
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fire_calculation_${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <Link href="/calculators">
          <Button variant="outline" className="group shadow-sm hover:shadow transition-all border-slate-200">
            <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Назад
          </Button>
        </Link>
        <div className="flex flex-col text-center md:text-right">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center md:justify-end gap-3">
            <div className="p-2 bg-red-500 rounded-xl shadow-lg shadow-red-200 dark:shadow-none">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            Калькулятор Огнетушителей
          </h1>
          <p className="text-slate-500 mt-1 flex items-center md:justify-end gap-2 text-sm">
            <Shield className="w-4 h-4 text-emerald-500" />
            Соответствие ППБ РК и СТ РК 1487-2006
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Input Form Card */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/80 dark:bg-slate-800/80 backdrop-blur-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-500" />
                Параметры объекта
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="area" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Общая площадь помещений (м²)
                </Label>
                <div className="relative">
                  <Input
                    id="area"
                    type="number"
                    placeholder="500"
                    className="h-11 px-4 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-red-500 transition-all text-lg font-medium"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">m²</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Категория взрывопожароопасности
                </Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ExtCategory)}>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_DATA).map(([key, item]) => (
                      <SelectItem key={key} value={key} className="py-2.5">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="floors" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Этажность
                  </Label>
                  <Input
                    id="floors"
                    type="number"
                    value={floors}
                    className="h-11 bg-slate-50 border-slate-200"
                    onChange={(e) => setFloors(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reserve" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Резерв (%)
                  </Label>
                  <Input
                    id="reserve"
                    type="number"
                    value={reservePercent}
                    className="h-11 bg-slate-50 border-slate-200"
                    onChange={(e) => setReservePercent(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <Checkbox
                    id="aupt"
                    checked={hasAUPT}
                    onCheckedChange={(checked) => setHasAUPT(checked === true)}
                  />
                  <Label htmlFor="aupt" className="leading-tight cursor-pointer text-sm font-medium">
                    Наличие АУПТ <span className="text-emerald-500 font-bold">(-50%)</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <Checkbox
                    id="electrical"
                    checked={hasElectrical}
                    onCheckedChange={(checked) => setHasElectrical(checked === true)}
                  />
                  <Label htmlFor="electrical" className="leading-tight cursor-pointer text-sm font-medium">
                    Электрооборудование под напряжением
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                  <Checkbox
                    id="cabinet"
                    checked={hasCabinets}
                    onCheckedChange={(checked) => setHasCabinets(checked === true)}
                  />
                  <Label htmlFor="cabinet" className="leading-tight cursor-pointer text-sm font-medium">
                    Наличие пожарных шкафов (ПК)
                  </Label>
                </div>
              </div>

              <Button
                onClick={reset}
                variant="ghost"
                className="w-full text-slate-400 hover:text-red-500 mt-2"
              >
                <RefreshCw className="mr-2 w-4 h-4" />
                Сбросить параметры
              </Button>
            </CardContent>
          </Card>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 flex gap-3">
            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              Результаты носят предварительный характер. Окончательное решение принимается на основе проектной документации.
            </p>
          </div>
        </div>

        {/* Results Side */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Summary Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-none border border-slate-100 dark:border-slate-700">
                    <div className="text-2xl font-black text-red-500 mb-1">{result.powderCount}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Порошковые</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-none border border-slate-100 dark:border-slate-700">
                    <div className="text-2xl font-black text-blue-500 mb-1">{result.co2Count}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Углекислотные</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-none border border-slate-100 dark:border-slate-700">
                    <div className="text-2xl font-black text-orange-500 mb-1">{result.mobileCount}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Передвижные</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/30 dark:shadow-none border border-slate-100 dark:border-slate-700">
                    <div className="text-2xl font-black text-emerald-500 mb-1">{result.totalCount}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Итого</div>
                  </div>
                </div>

                {/* Main Results Card */}
                <Card className="border-none shadow-2xl shadow-slate-200/60 dark:shadow-none overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-700">
                    <CardTitle className="text-xl font-black text-slate-800 dark:text-white">
                      Детальный расчет
                    </CardTitle>
                    <Button size="sm" onClick={exportResult} className="bg-slate-900 hover:bg-black text-white h-9">
                      <FileDown className="mr-2 w-4 h-4" />
                      Экспорт отчета
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">

                    {/* Detailed Reasons */}
                    <div className="divide-y divide-slate-50 dark:divide-slate-700">
                      {result.reasons.map((reason, idx) => (
                        <div key={idx} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                          <div className="mt-1">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">
                              {reason.label}
                            </span>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[15px]">
                              {reason.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Warnings Section */}
                    {result.warnings.length > 0 && (
                      <div className="bg-red-50/50 dark:bg-red-900/10 p-5 border-t border-red-50 dark:border-red-900/20">
                        <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-4 h-4" />
                          ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ
                        </h4>
                        <div className="space-y-2">
                          {result.warnings.map((warn, i) => (
                            <div key={i} className="flex gap-2 text-sm text-red-700 dark:text-red-300">
                              <span className="font-bold">•</span>
                              {warn}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Floor Distribution */}
                    <div className="p-5 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <Construction className="w-4 h-4" />
                          Размещение по этажам
                        </h4>
                        <Badge variant="outline" className="text-xs bg-white dark:bg-slate-800">
                          {result.maxDistance}м до очага
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.perFloor.map((count, i) => (
                          <div key={i} className="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center min-w-[80px]">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Эт. {i + 1}</span>
                            <span className="text-xl font-black text-slate-700 dark:text-slate-200">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Link href="/calculators/methodology" className="flex-1">
                    <Button variant="outline" className="w-full h-12 rounded-xl group hover:border-red-500 hover:text-red-500 transition-all border-slate-200">
                      <Info className="mr-2 w-4 h-4" />
                      Открыть методичку НПА
                      <ExternalLink className="ml-2 w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl min-h-[500px]">
                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-6 relative">
                  <Calculator className="w-16 h-16 text-slate-300" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge className="bg-red-500 border-none">LIVE</Badge>
                  </motion.div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Готов к расчету</h3>
                <p className="text-slate-500 max-w-sm">
                  Введите площадь и категорию взрывопожароопасности, чтобы получить детальный отчет согласно НПА РК.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
