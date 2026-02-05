import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, RefreshCw, FileDown, AlertTriangle, CheckCircle, Users, Truck } from "lucide-react";

interface NGPSResult {
  required: boolean;
  reason: string;
  personnelPerShift: number;
  totalPersonnel: number;
  vehicles: string[];
  recommendations: string[];
  legalBasis: string[];
}

const OBJECT_TYPES = [
  { value: "oil_gas", label: "Нефтегазовые объекты", inList: true },
  { value: "chemical", label: "Химическое производство", inList: true },
  { value: "energy", label: "Энергетические объекты", inList: true },
  { value: "mining", label: "Горнодобывающие предприятия", inList: true },
  { value: "airport", label: "Аэропорты", inList: true },
  { value: "fuel_depot", label: "Склады ГСМ", inList: true },
  { value: "port", label: "Морские/речные порты", inList: true },
  { value: "warehouse", label: "Крупные складские комплексы", inList: false },
  { value: "manufacturing", label: "Производственные предприятия", inList: false },
  { value: "commercial", label: "Торговые центры", inList: false },
  { value: "other", label: "Другое", inList: false },
];

export default function NGPSCalculator() {
  const [objectType, setObjectType] = useState("");
  const [area, setArea] = useState("");
  const [personnel, setPersonnel] = useState("");
  const [distanceToGPS, setDistanceToGPS] = useState("");
  const [hasHazardous, setHasHazardous] = useState(false);
  const [result, setResult] = useState<NGPSResult | null>(null);

  const calculate = () => {
    if (!objectType) return;

    const areaNum = parseFloat(area) || 0;
    const personnelNum = parseInt(personnel) || 0;
    const distanceNum = parseFloat(distanceToGPS) || 0;

    const objectInfo = OBJECT_TYPES.find(o => o.value === objectType);
    const inPerechenList = objectInfo?.inList || false;

    let required = false;
    let reason = "";
    let personnelPerShift = 0;
    let totalPersonnel = 0;
    const vehicles: string[] = [];
    const recommendations: string[] = [];
    const legalBasis: string[] = [];

    if (inPerechenList) {
      required = true;
      reason = "Объект входит в Перечень (Приказ МЧС РК №281 от 29.05.2023)";
      legalBasis.push("Приказ МЧС РК №281 от 29.05.2023");
      legalBasis.push("ППБ РК (Приказ №55), п. 7");
    } else if (distanceNum > 3) {
      required = true;
      reason = `Расстояние до ближайшей пожарной части более 3 км (${distanceNum} км)`;
      legalBasis.push("Закон РК «О гражданской защите», ст. 53");
    } else if (hasHazardous && areaNum > 5000) {
      required = true;
      reason = "Наличие опасных веществ и большая площадь требуют НГПС";
      legalBasis.push("Закон РК «О гражданской защите», ст. 53");
    }

    if (required) {
      if (areaNum <= 5000) {
        personnelPerShift = 4;
        vehicles.push("АЦ (автоцистерна) — 1 ед.");
      } else if (areaNum <= 20000) {
        personnelPerShift = 6;
        vehicles.push("АЦ (автоцистерна) — 1 ед.");
        vehicles.push("АНР (автонасос) — 1 ед.");
      } else if (areaNum <= 50000) {
        personnelPerShift = 9;
        vehicles.push("АЦ (автоцистерна) — 2 ед.");
        vehicles.push("АНР (автонасос) — 1 ед.");
      } else {
        personnelPerShift = 12;
        vehicles.push("АЦ (автоцистерна) — 2 ед.");
        vehicles.push("АНР (автонасос) — 1 ед.");
        vehicles.push("АЛ (автолестница) — 1 ед.");
      }

      totalPersonnel = personnelPerShift * 4;

      recommendations.push(`Штат в смене: ${personnelPerShift} чел. (включая начальника караула)`);
      recommendations.push(`Общий штат: ${totalPersonnel} чел. (4 караула × ${personnelPerShift} чел.)`);
      recommendations.push("Допускается заключение договора с ГПС для частичного покрытия");

      if (hasHazardous) {
        vehicles.push("Спецтехника для работы с опасными веществами");
        recommendations.push("Требуется дополнительное обучение личного состава для работы с ОВ");
      }
    } else {
      reason = "НГПС не требуется по действующим НПА";
      recommendations.push("Объект не входит в Перечень (Приказ МЧС №281)");
      recommendations.push("Расстояние до ГПС менее 3 км — защита обеспечивается подразделениями ГПС");
      recommendations.push("Рекомендуется наличие добровольной пожарной дружины");
      legalBasis.push("Приказ МЧС РК №281 (объект не входит)");
    }

    setResult({
      required,
      reason,
      personnelPerShift,
      totalPersonnel,
      vehicles,
      recommendations,
      legalBasis,
    });
  };

  const reset = () => {
    setObjectType("");
    setArea("");
    setPersonnel("");
    setDistanceToGPS("");
    setHasHazardous(false);
    setResult(null);
  };

  const exportResult = () => {
    if (!result) return;

    const objectInfo = OBJECT_TYPES.find(o => o.value === objectType);
    const content = `РАСЧЁТ НЕОБХОДИМОСТИ НГПС
========================
Дата: ${new Date().toLocaleDateString("ru-RU")}

ИСХОДНЫЕ ДАННЫЕ:
- Тип объекта: ${objectInfo?.label || objectType}
- Площадь: ${area || "не указана"} м²
- Персонал: ${personnel || "не указан"} чел.
- Расстояние до ГПС: ${distanceToGPS || "не указано"} км
- Опасные вещества: ${hasHazardous ? "Да" : "Нет"}

РЕЗУЛЬТАТ: ${result.required ? "НГПС ТРЕБУЕТСЯ" : "НГПС НЕ ТРЕБУЕТСЯ"}
Обоснование: ${result.reason}

${result.required ? `ШТАТ:
- В смене: ${result.personnelPerShift} чел.
- Всего: ${result.totalPersonnel} чел.

ТЕХНИКА:
${result.vehicles.map(v => `• ${v}`).join("\n")}
` : ""}

РЕКОМЕНДАЦИИ:
${result.recommendations.map(r => `• ${r}`).join("\n")}

ПРАВОВАЯ ОСНОВА:
${result.legalBasis.map(l => `• ${l}`).join("\n")}
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ngps_calculation_${new Date().toISOString().split("T")[0]}.txt`;
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
        <h1 className="text-4xl font-black text-foreground mb-4 flex items-center justify-center">
          <Shield className="mr-4 w-10 h-10 text-blue-600" />
          Калькулятор ПСС (НГПС)
        </h1>
        <p className="text-xl text-black dark:text-white font-bold max-w-2xl mx-auto">
          Проверка обязательности негосударственной противопожарной службы
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Параметры объекта</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Тип объекта</Label>
              <Select value={objectType} onValueChange={setObjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип объекта" />
                </SelectTrigger>
                <SelectContent>
                  {OBJECT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label} {type.inList && <Badge variant="destructive" className="ml-2 text-xs">Перечень №281</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="area">Площадь объекта (м²)</Label>
              <Input
                id="area"
                type="number"
                placeholder="например, 10000"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="personnel">Количество работников</Label>
              <Input
                id="personnel"
                type="number"
                placeholder="например, 200"
                value={personnel}
                onChange={(e) => setPersonnel(e.target.value)}
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="distance">Расстояние до ближайшей пожарной части (км)</Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                placeholder="например, 5.5"
                value={distanceToGPS}
                onChange={(e) => setDistanceToGPS(e.target.value)}
                min="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hazardous"
                checked={hasHazardous}
                onCheckedChange={(checked) => setHasHazardous(checked === true)}
              />
              <Label htmlFor="hazardous" className="cursor-pointer">
                Наличие опасных веществ (ГСМ, химия, взрывчатые)
              </Label>
            </div>

            <div className="flex gap-3">
              <Button onClick={calculate} className="flex-1 bg-blue-500 hover:bg-blue-600">
                <Shield className="mr-2 w-4 h-4" />
                Проверить
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
              Результат проверки
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
                <div className={`p-6 rounded-lg text-center ${result.required
                    ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800"
                    : "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800"
                  }`}>
                  <div className={`text-3xl font-black mb-2 ${result.required ? "text-red-700 dark:text-red-500" : "text-green-700 dark:text-green-500"}`}>
                    {result.required ? "НГПС ТРЕБУЕТСЯ" : "НГПС НЕ ТРЕБУЕТСЯ"}
                  </div>
                  <div className="text-base text-black dark:text-white font-bold">{result.reason}</div>
                </div>

                {result.required && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg text-center border border-blue-200">
                        <Users className="w-8 h-8 mx-auto mb-2 text-blue-700" />
                        <div className="text-3xl font-black text-blue-700 dark:text-blue-400">{result.personnelPerShift}</div>
                        <div className="text-sm text-black dark:text-white font-bold">чел. в смене</div>
                      </div>
                      <div className="p-4 bg-purple-100/50 dark:bg-purple-900/30 rounded-lg text-center border border-purple-200">
                        <Users className="w-8 h-8 mx-auto mb-2 text-purple-700" />
                        <div className="text-3xl font-black text-purple-700 dark:text-purple-400">{result.totalPersonnel}</div>
                        <div className="text-sm text-black dark:text-white font-bold">чел. всего</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center">
                        <Truck className="mr-2 w-4 h-4 text-orange-500" />
                        Необходимая техника
                      </h4>
                      <ul className="space-y-1 text-sm">
                        {result.vehicles.map((vehicle, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="text-orange-500 mr-2">•</span>
                            {vehicle}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <h4 className="font-black text-lg flex items-center text-black dark:text-white">
                    <CheckCircle className="mr-2 w-5 h-5 text-green-600" />
                    Рекомендации
                  </h4>
                  <ul className="space-y-2 text-base font-bold text-black dark:text-white">
                    {result.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-600 mr-2 font-black">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2 text-sm">Правовая основа:</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.legalBasis.map((basis, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {basis}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Введите параметры и нажмите «Проверить»
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
