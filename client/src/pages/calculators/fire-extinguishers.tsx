import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calculator, RefreshCw, FileDown, AlertTriangle, CheckCircle } from "lucide-react";

interface CalculationResult {
  powderCount: number;
  co2Count: number;
  waterCount: number;
  mobileCount: number;
  reserveCount: number;
  totalCount: number;
  totalPortable: number;
  perFloor: number[];
  recommendations: string[];
  warnings: string[];
}

const CATEGORY_NORMS: Record<string, { area: number; powder: number; co2: number }> = {
  "A": { area: 200, powder: 4, co2: 4 },
  "B": { area: 200, powder: 4, co2: 4 },
  "V": { area: 400, powder: 2, co2: 2 },
  "G": { area: 800, powder: 2, co2: 2 },
  "D": { area: 1800, powder: 2, co2: 2 },
};

const MIN_PER_FLOOR = 2;
const AUPT_REDUCTION = 0.5;
const MOBILE_THRESHOLD = 500;
const DEFAULT_RESERVE = 10;

const splitByFloors = (total: number, floors: number) => {
  const safeFloors = Math.max(1, floors);
  const distribution = Array.from({ length: safeFloors }, () => 0);

  for (let i = 0; i < total; i += 1) {
    distribution[i % safeFloors] += 1;
  }

  return distribution;
};

export default function FireExtinguisherCalculator() {
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("");
  const [floors, setFloors] = useState("1");
  const [hasAUPT, setHasAUPT] = useState(false);
  const [hasElectrical, setHasElectrical] = useState(false);
  const [hasCabinets, setHasCabinets] = useState(false);
  const [reservePercent, setReservePercent] = useState(String(DEFAULT_RESERVE));
  const [buildingType, setBuildingType] = useState("production");
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculate = () => {
    if (!area || !category) return;

    const areaNum = parseFloat(area);
    const floorsNum = parseInt(floors) || 1;
    const norm = CATEGORY_NORMS[category];
    const reservePercentNum = Math.max(0, parseFloat(reservePercent) || 0);
    
    if (!norm) return;

    let baseCount = Math.ceil(areaNum / norm.area) * norm.powder;
    const minTotal = MIN_PER_FLOOR * floorsNum;
    
    if (category === "D" && areaNum <= 100) {
      setResult({
        powderCount: 0,
        co2Count: 0,
        waterCount: 0,
        mobileCount: 0,
        reserveCount: 0,
        totalCount: 0,
        totalPortable: 0,
        perFloor: [],
        recommendations: ["Помещение категории Д площадью до 100 м² допускается не оснащать огнетушителями (ППБ РК, Прил. 3, п. 9)"],
        warnings: [],
      });
      return;
    }

    if (hasAUPT) {
      baseCount = Math.ceil(baseCount * AUPT_REDUCTION);
    }

    baseCount = Math.max(baseCount, minTotal);

    let powderCount = baseCount;
    let co2Count = 0;

    if (hasElectrical) {
      const recommendedCo2 = Math.round(baseCount * 0.15);
      co2Count = baseCount >= 2 ? Math.max(2, recommendedCo2) : 1;
      co2Count = Math.min(co2Count, baseCount);
      powderCount = baseCount - co2Count;
    }

    const mobileCount = areaNum > MOBILE_THRESHOLD ? 1 + Math.ceil((areaNum - MOBILE_THRESHOLD) / 1000) : 0;
    const totalPortable = powderCount + co2Count;
    const reserveCount = Math.ceil(totalPortable * (reservePercentNum / 100));
    const perFloor = splitByFloors(totalPortable, floorsNum);

    const recommendations: string[] = [];
    const warnings: string[] = [];

    recommendations.push(`Минимум по этажам: ${MIN_PER_FLOOR} шт. на этаж (всего ${minTotal} шт. минимально).`);
    recommendations.push(`Порошковые огнетушители ОП-4/ОП-5: ${powderCount} шт.`);
    
    if (co2Count > 0) {
      recommendations.push(`Углекислотные огнетушители ОУ-3/ОУ-5: ${co2Count} шт. (для электрооборудования)`);
    }

    if (perFloor.length > 1) {
      recommendations.push(`Распределение по этажам: ${perFloor.map((count, index) => `этаж ${index + 1} — ${count} шт.`).join(", ")}`);
    }

    if (mobileCount > 0) {
      recommendations.push(`Передвижные огнетушители ОП-25/ОП-50: ${mobileCount} шт.`);
    }

    recommendations.push(`Резерв на ТО: ${reserveCount} шт. (${reservePercentNum}% от переносных, СТ РК 1487-2006 п. 8.5)`);

    if (category === "A" || category === "B") {
      warnings.push("Категория А/Б требует взрывозащищенного электрооборудования");
    }

    if (hasAUPT) {
      recommendations.push("Применено сокращение 50% при наличии АУПТ (ППБ РК, Прил. 3, п. 13)");
    }

    if (hasCabinets) {
      recommendations.push("Пожарные шкафы: в каждом шкафу не менее 2 огнетушителей массой заряда ≥ 5 кг.");
    }

    const maxDistance = buildingType === "public" ? 20 :
      category === "A" || category === "B" || category === "V" ? 30 : 
      category === "G" ? 40 : 70;
    recommendations.push(`Максимальное расстояние до огнетушителя: ${maxDistance} м`);

    setResult({
      powderCount,
      co2Count,
      waterCount: 0,
      mobileCount,
      reserveCount,
      totalCount: totalPortable + mobileCount + reserveCount,
      totalPortable,
      perFloor,
      recommendations,
      warnings,
    });
  };

  const reset = () => {
    setArea("");
    setCategory("");
    setFloors("1");
    setHasAUPT(false);
    setHasElectrical(false);
    setHasCabinets(false);
    setReservePercent(String(DEFAULT_RESERVE));
    setBuildingType("production");
    setResult(null);
  };

  const exportResult = () => {
    if (!result) return;
    
    const content = `РАСЧЁТ ПЕРВИЧНЫХ СРЕДСТВ ПОЖАРОТУШЕНИЯ
======================================
Дата: ${new Date().toLocaleDateString("ru-RU")}

ИСХОДНЫЕ ДАННЫЕ:
- Площадь: ${area} м²
- Категория: ${category}
- Этажей: ${floors}
- АУПТ: ${hasAUPT ? "Да" : "Нет"}
- Электрооборудование: ${hasElectrical ? "Да" : "Нет"}
- Пожарные шкафы: ${hasCabinets ? "Да" : "Нет"}
- Тип объекта: ${buildingType === "public" ? "Общественное/административное" : "Производственное/складское"}
- Резерв: ${reservePercent}%

РЕЗУЛЬТАТ:
- Порошковые: ${result.powderCount} шт.
- Углекислотные: ${result.co2Count} шт.
- Передвижные: ${result.mobileCount} шт.
- Резерв: ${result.reserveCount} шт.
- Переносные: ${result.totalPortable} шт.
- ИТОГО: ${result.totalCount} шт.

РЕКОМЕНДАЦИИ:
${result.recommendations.map(r => `• ${r}`).join("\n")}

${result.warnings.length > 0 ? `ПРЕДУПРЕЖДЕНИЯ:\n${result.warnings.map(w => `⚠ ${w}`).join("\n")}` : ""}

Основание: ППБ РК (Приказ МЧС №55), Приложение 3; СТ РК 1487-2006
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fire_extinguishers_${new Date().toISOString().split("T")[0]}.txt`;
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
            <CardTitle>Параметры помещения</CardTitle>
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
                min="0"
              />
            </div>

            <div>
              <Label>Тип объекта</Label>
              <Select value={buildingType} onValueChange={setBuildingType}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Производственное/складское</SelectItem>
                  <SelectItem value="public">Общественное/административное</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Категория помещения по взрывопожароопасности</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">А — повышенная взрывопожароопасность</SelectItem>
                  <SelectItem value="B">Б — взрывопожароопасность</SelectItem>
                  <SelectItem value="V">В — пожароопасность</SelectItem>
                  <SelectItem value="G">Г — умеренная пожароопасность</SelectItem>
                  <SelectItem value="D">Д — пониженная пожароопасность</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="floors">Количество этажей</Label>
              <Input
                id="floors"
                type="number"
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="aupt"
                  checked={hasAUPT}
                  onCheckedChange={(checked) => setHasAUPT(checked === true)}
                />
                <Label htmlFor="aupt" className="cursor-pointer">
                  Наличие АУПТ (автоматического пожаротушения)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="electrical"
                  checked={hasElectrical}
                  onCheckedChange={(checked) => setHasElectrical(checked === true)}
                />
                <Label htmlFor="electrical" className="cursor-pointer">
                  Электрооборудование под напряжением
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cabinet"
                  checked={hasCabinets}
                  onCheckedChange={(checked) => setHasCabinets(checked === true)}
                />
                <Label htmlFor="cabinet" className="cursor-pointer">
                  Есть пожарные шкафы (ПК)
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="reserve">Резерв на ТО (%)</Label>
              <Input
                id="reserve"
                type="number"
                min="0"
                max="50"
                value={reservePercent}
                onChange={(e) => setReservePercent(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={calculate} className="flex-1 bg-red-500 hover:bg-red-600">
                <Calculator className="mr-2 w-4 h-4" />
                Рассчитать
              </Button>
              <Button variant="outline" onClick={reset}>
                <RefreshCw className="mr-2 w-4 h-4" />
                Сброс
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Результат расчёта
              {result && (
                <Button variant="outline" size="sm" onClick={exportResult}>
                  <FileDown className="mr-2 w-4 h-4" />
                  Экспорт
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                    <div className="text-3xl font-bold text-red-600">{result.powderCount}</div>
                    <div className="text-sm text-muted-foreground">Порошковые ОП</div>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">{result.co2Count}</div>
                    <div className="text-sm text-muted-foreground">Углекислотные ОУ</div>
                  </div>
                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                    <div className="text-3xl font-bold text-orange-600">{result.mobileCount}</div>
                    <div className="text-sm text-muted-foreground">Передвижные</div>
                  </div>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center">
                    <div className="text-3xl font-bold text-emerald-600">{result.reserveCount}</div>
                    <div className="text-sm text-muted-foreground">Резерв</div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-lg text-center">
                    <div className="text-3xl font-bold text-slate-600">{result.totalPortable}</div>
                    <div className="text-sm text-muted-foreground">Переносные</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">{result.totalCount}</div>
                    <div className="text-sm text-muted-foreground">Всего с резервом</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center">
                    <CheckCircle className="mr-2 w-4 h-4 text-green-500" />
                    Рекомендации
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {result.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center text-orange-600">
                      <AlertTriangle className="mr-2 w-4 h-4" />
                      Предупреждения
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {result.warnings.map((warn, idx) => (
                        <li key={idx} className="flex items-start text-orange-600">
                          <span className="mr-2">⚠</span>
                          {warn}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Badge variant="outline">
                    Основание: ППБ РК (Приказ МЧС №55), СТ РК 1487-2006
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Введите параметры и нажмите «Рассчитать»
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
