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

      <div className="mb-6">
        <Link href="/calculators">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Назад к калькуляторам
          </Button>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center">
          <Calculator className="mr-3 w-8 h-8 text-red-500" />
          Калькулятор первичных средств пожаротушения
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Расчёт по ППБ РК (Прил. 3) и СТ РК 1487-2006
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Параметры объекта</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="area">Общая площадь помещений (м²)</Label>
              <Input
                id="area"
                type="number"
                placeholder="например, 500"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div>
              <Label>Категория взрывопожароопасности</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ExtCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_DATA).map(([key, item]) => (
                    <SelectItem key={key} value={key}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="floors">Этажность</Label>
                <Input
                  id="floors"
                  type="number"
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="reserve">Резерв (%)</Label>
                <Input
                  id="reserve"
                  type="number"
                  value={reservePercent}
                  onChange={(e) => setReservePercent(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aupt"
                  checked={hasAUPT}
                  onCheckedChange={(checked) => setHasAUPT(checked === true)}
                />
                <Label htmlFor="aupt" className="cursor-pointer text-sm font-medium">
                  Наличие АУПТ <span className="text-emerald-500 font-bold">(-50%)</span>
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="electrical"
                  checked={hasElectrical}
                  onCheckedChange={(checked) => setHasElectrical(checked === true)}
                />
                <Label htmlFor="electrical" className="cursor-pointer text-sm font-medium">
                  Электрооборудование под напряжением
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cabinet"
                  checked={hasCabinets}
                  onCheckedChange={(checked) => setHasCabinets(checked === true)}
                />
                <Label htmlFor="cabinet" className="cursor-pointer text-sm font-medium">
                  Наличие пожарных шкафов (ПК)
                </Label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={reset} variant="outline" className="flex-1">
                <RefreshCw className="mr-2 w-4 h-4" />
                Сброс
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Результат расчета
              {result && (
                <Button variant="outline" size="sm" onClick={exportResult}>
                  <FileDown className="mr-2 w-4 h-4" />
                  Экспорт
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center border border-red-100 dark:border-red-800">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{result.powderCount}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">Порошк.</div>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-100 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.co2Count}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">Углек.</div>
                    </div>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center border border-orange-100 dark:border-orange-800">
                      <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{result.mobileCount}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">Передв.</div>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center border border-emerald-100 dark:border-emerald-800">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.totalCount}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">Итого</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Обоснование расчета:</h4>
                    <ul className="space-y-2">
                      {result.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start text-sm">
                          <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 shrink-0 mt-0.5" />
                          <span>
                            <span className="font-bold">{reason.label}:</span> {reason.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {result.warnings.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="flex items-center text-red-600 dark:text-red-400 font-bold text-sm mb-2">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
                      </div>
                      <ul className="space-y-1 text-xs">
                        {result.warnings.map((warn, i) => (
                          <li key={i} className="flex items-start">
                            <span className="mr-2">•</span>
                            {warn}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <Link href="/calculators/methodology">
                      <Button variant="link" className="text-xs h-auto p-0">
                        <Info className="w-3 h-3 mr-1" />
                        Открыть справочник НПА по огнетушителям
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Введите параметры объекта для получения расчета
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
