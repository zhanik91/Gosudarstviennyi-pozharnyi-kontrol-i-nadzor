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

type ObjType = "PRODUCTION" | "SERVICE" | "PETROLEUM" | "CONSTRUCTION";
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

const TABLE_5_DATA = [
  { id: "sto", label: "СТО (Станция тех. обслуживания)", areaNorm: 100, powder: 2, co2: 1, shield: "" },
  { id: "parking_open", label: "Открытые стоянки", areaNorm: 100, powder: 2, co2: 0, shield: "В" },
  { id: "garage", label: "Гаражи (на 1 бокс)", areaNorm: 0, powder: 1, co2: 0, shield: "" },
  { id: "azs_large", label: "АЗС (>= 500 запр/сут)", areaNorm: 0, powder: 4, co2: 2, note: "Требуется 1х ОП-100 передвижной" },
  { id: "azs_small", label: "АЗС (< 500 запр/сут)", areaNorm: 0, powder: 2, co2: 2, note: "Требуется 1х ОП-100 передвижной" },
  { id: "azs_shop", label: "Магазин/кафе при АЗС", areaNorm: 100, powder: 1, co2: 1, shield: "" },
  { id: "kiosk", label: "Торговые павильоны/киоски", areaNorm: 100, powder: 1, co2: 0, shield: "" },
  { id: "office", label: "Офисы, банки, клубы", areaNorm: 100, powder: 2, co2: 0, shield: "" },
];

const APP_10_DATA = [
  { id: "pump", label: "Насосные по перекачке нефтепродуктов", areaNorm: 50, co2: 2, foam: 2, sand: 1, blanket: 1 },
  { id: "kip", label: "Помещения КИПиА", areaNorm: 50, co2: 2, foam: 0, sand: 0, blanket: 0 },
  { id: "storage_tare", label: "Хранилище нефтепродуктов в таре", areaNorm: 200, powder: 2, foam: 1, sand: 0, blanket: 0 },
  { id: "lab", label: "Лаборатории", areaNorm: 50, co2: 1, foam: 2, sand: 0, blanket: 0 },
  { id: "boiler", label: "Котельные", areaNorm: 100, co2: 1, foam: 2, powder: 1, sand: 0, blanket: 0 },
];

const APP_11_DATA = [
  { id: "scaffolding", label: "Строительные леса (на 20м длины)", powder: 1 },
  { id: "cabin", label: "Бытовки / временные здания (100 м²)", powder: 1, sand: 1, water: 1 },
  { id: "storage_timber", label: "Склады лесоматериалов (300 м³)", powder: 1, sand: 1, water: 1 },
];

export default function FireExtinguishersCalculator() {
  const [objType, setObjType] = useState<ObjType>("PRODUCTION");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState<ExtCategory | "">("");
  const [subCategory, setSubCategory] = useState("");
  const [floors, setFloors] = useState("1");
  const [hasAUPT, setHasAUPT] = useState(false);
  const [hasElectrical, setHasElectrical] = useState(false);
  const [hasCabinets, setHasCabinets] = useState(false);
  const [reservePercent, setReservePercent] = useState("10");

  const result = useMemo<CalculationResult | null>(() => {
    const S = parseFloat(area) || 0;
    if (S <= 0) return null;
    const N = Math.max(1, parseInt(floors) || 1);
    const reservePct = Math.max(0, parseFloat(reservePercent) || 0);

    const reasons: { label: string; text: string; link?: string }[] = [];
    const warnings: string[] = [];
    let powderCount = 0;
    let co2Count = 0;
    let waterCount = 0;
    let mobileCount = 0;
    let maxDistance = 20;

    // --- Mode 1: Production (App 3 Table 1/2) ---
    if (objType === "PRODUCTION") {
      if (!category) return null;
      const data = CATEGORY_DATA[category as ExtCategory];
      maxDistance = data.distance;

      if (category === "D" && S <= 100) {
        return {
          powderCount: 0, co2Count: 0, waterCount: 0, mobileCount: 0, reserveCount: 0,
          totalPortable: 0, totalCount: 0, perFloor: [],
          reasons: [{ label: "Исключение", text: "Для категорий Д до 100 м² огнетушители не требуются." }],
          warnings: [], maxDistance: 70
        };
      }

      const blocks = Math.ceil(S / data.blockArea);
      let portableQty = blocks * data.powderNorm;
      reasons.push({ label: "Базовый расчет", text: `Для ${S} м² требуется ${portableQty} шт. (${data.powderNorm} на ${data.blockArea} м²).` });

      if (hasAUPT) {
        portableQty = Math.round(portableQty * 0.5);
        reasons.push({ label: "АУПТ", text: "Скидка 50% согласно п. 13 Прил. 3." });
      }

      if (portableQty < N * 2) {
        portableQty = N * 2;
        reasons.push({ label: "Минимум", text: `Минимум 2 шт. на этаж (всего ${portableQty}).` });
      }

      powderCount = portableQty;
      if (hasElectrical) {
        co2Count = Math.max(1, Math.round(portableQty * 0.2));
        powderCount -= co2Count;
        reasons.push({ label: "Электрика", text: `Замена ${co2Count} шт. на ОУ.` });
      }

      if (data.mobileThreshold && S > data.mobileThreshold) {
        mobileCount = 1 + Math.ceil((S - data.mobileThreshold) / 1000);
      }
    }
    // --- Mode 2: Service (Table 5) ---
    else if (objType === "SERVICE") {
      if (!subCategory) return null;
      const data = TABLE_5_DATA.find(d => d.id === subCategory);
      if (!data) return null;

      if (data.areaNorm > 0) {
        const units = Math.ceil(S / data.areaNorm);
        powderCount = units * data.powder;
        co2Count = units * data.co2;
        reasons.push({ label: "Таблица 5", text: `Норма для ${data.label}: каждые ${data.areaNorm} м².` });
      } else {
        powderCount = data.powder;
        co2Count = data.co2;
        reasons.push({ label: "Таблица 5", text: `Постоянная норма для ${data.label}.` });
      }
      if (data.shield) warnings.push(`Установить щит ЩП-${data.shield}.`);
      if (data.note) warnings.push(data.note);
    }
    // --- Mode 3: Petroleum (App 10) ---
    else if (objType === "PETROLEUM") {
      if (!subCategory) return null;
      const data = APP_10_DATA.find(d => d.id === subCategory);
      if (!data) return null;

      const units = Math.ceil(S / data.areaNorm);
      co2Count = units * (data.co2 || 0);
      waterCount = units * (data.foam || 0);
      powderCount = units * (data.powder || 0);
      reasons.push({ label: "Прил. 10", text: `ОСП по норме для ${data.label}.` });
    }
    // --- Mode 4: Construction (App 11) ---
    else if (objType === "CONSTRUCTION") {
      if (!subCategory) return null;
      const data = APP_11_DATA.find(d => d.id === subCategory);
      if (!data) return null;

      powderCount = data.powder || 0;
      reasons.push({ label: "Прил. 11", text: `Норма для стройки: ${data.label}.` });
    }

    const totalPortable = powderCount + co2Count + waterCount;
    const reserveCount = Math.ceil(totalPortable * (reservePct / 100));
    const perFloorArr = Array(N).fill(0);
    for (let i = 0; i < totalPortable; i++) perFloorArr[i % N] += 1;

    if (hasCabinets) warnings.push("Не менее 2 шт. ОСП в каждом ПК.");

    return {
      powderCount, co2Count, waterCount, mobileCount, reserveCount,
      totalPortable, totalCount: totalPortable + mobileCount + reserveCount,
      perFloor: perFloorArr, reasons, warnings, maxDistance
    };
  }, [area, category, subCategory, objType, floors, hasAUPT, hasElectrical, hasCabinets, reservePercent]);

  const reset = () => {
    setArea(""); setCategory(""); setSubCategory(""); setFloors("1");
    setHasAUPT(false); setHasElectrical(false); setHasCabinets(false);
    setReservePercent("10"); setObjType("PRODUCTION");
  };

  const exportResult = () => {
    if (!result) return;
    const content = `ОТЧЕТ ПО РАСЧЕТУ ПЕРВИЧНЫХ СРЕДСТВ ПОЖАРОТУШЕНИЯ\nДата: ${new Date().toLocaleDateString("ru-RU")}\nПлощадь: ${area} м²\nРезультат: ${result.totalCount} шт.`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fire_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/calculators">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 w-4 h-4" /> Назад
          </Button>
        </Link>
      </div>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center">
          <Calculator className="mr-3 w-8 h-8 text-red-500" />
          Калькулятор первичных средств пожаротушения
        </h1>
        <p className="text-muted-foreground">ППБ РК, Приложения 3, 10, 11 и Таблица 5</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Параметры объекта</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Сценарий расчета</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "PRODUCTION", label: "Пром/Общ", icon: Flame },
                  { id: "SERVICE", label: "Обслуж.", icon: RefreshCw },
                  { id: "PETROLEUM", label: "Нефтебаза", icon: Layers },
                  { id: "CONSTRUCTION", label: "Стройка", icon: Construction }
                ].map((t) => (
                  <Button
                    key={t.id}
                    variant={objType === t.id ? "default" : "outline"}
                    size="sm"
                    className="flex-1 min-w-[100px]"
                    onClick={() => setObjType(t.id as ObjType)}
                  >
                    <t.icon className="w-4 h-4 mr-2" /> {t.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Общая площадь (м²)</Label>
              <Input id="area" type="number" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>

            {objType === "PRODUCTION" ? (
              <div className="space-y-2">
                <Label>Категория взрывопожароопасности</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ExtCategory)}>
                  <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_DATA).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Тип участка / Оборудование</Label>
                <Select value={subCategory} onValueChange={setSubCategory}>
                  <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                  <SelectContent>
                    {objType === "SERVICE" && TABLE_5_DATA.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                    {objType === "PETROLEUM" && APP_10_DATA.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                    {objType === "CONSTRUCTION" && APP_11_DATA.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Этажность</Label>
                <Input type="number" min="1" value={floors} onChange={(e) => setFloors(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Резерв (%)</Label>
                <Input type="number" min="0" value={reservePercent} onChange={(e) => setReservePercent(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="aupt" checked={hasAUPT} onCheckedChange={(c) => setHasAUPT(!!c)} />
                <Label htmlFor="aupt" className="text-sm cursor-pointer">АУПТ (-50%)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="elec" checked={hasElectrical} onCheckedChange={(c) => setHasElectrical(!!c)} />
                <Label htmlFor="elec" className="text-sm cursor-pointer">Эл. оборуд.</Label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1" onClick={reset}>Сбросить</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Результат
              {result && <Button variant="ghost" size="sm" onClick={exportResult}><FileDown className="w-4 h-4 mr-2" /> Экспорт</Button>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="res" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-red-100/50 dark:bg-red-900/20 rounded-xl text-center border border-red-200 dark:border-red-800">
                      <div className="text-3xl font-bold text-red-600">{result.powderCount}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Порошковые (ОП)</div>
                    </div>
                    <div className="p-4 bg-blue-100/50 dark:bg-blue-900/20 rounded-xl text-center border border-blue-200 dark:border-blue-800">
                      <div className="text-3xl font-bold text-blue-600">{result.co2Count}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Углекисл. (ОУ)</div>
                    </div>
                    <div className="p-4 bg-orange-100/50 dark:bg-orange-900/20 rounded-xl text-center border border-orange-200 dark:border-orange-800">
                      <div className="text-3xl font-bold text-orange-600">{result.waterCount}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Пенные (ОВП)</div>
                    </div>
                    <div className="p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl text-center border border-slate-200 dark:border-slate-700">
                      <div className="text-3xl font-bold">{result.totalCount}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">Всего (с рез)</div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-bold text-sm flex items-center"><Info className="w-4 h-4 mr-2" /> Обоснование:</h4>
                    <ul className="space-y-2">
                      {result.reasons.map((r, i) => (
                        <li key={i} className="text-xs flex items-start">
                          <CheckCircle className="w-3 h-3 text-emerald-500 mr-2 mt-0.5 shrink-0" />
                          <span><span className="font-bold">{r.label}:</span> {r.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {result.warnings.length > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
                      <h4 className="text-amber-700 dark:text-amber-400 text-xs font-bold mb-2 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-2" /> ТРЕБОВАНИЯ И ИНВЕНТАРЬ:
                      </h4>
                      <ul className="space-y-1">
                        {result.warnings.map((w, i) => <li key={i} className="text-[10px]">• {w}</li>)}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="py-20 text-center text-muted-foreground">
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  Укажите площадь и категорию взрывопожароопасности
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
