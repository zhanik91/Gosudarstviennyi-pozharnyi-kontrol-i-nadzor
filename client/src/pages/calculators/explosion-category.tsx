import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Flame, RefreshCw, FileDown, AlertTriangle, CheckCircle, Plus, Trash2 } from "lucide-react";

interface Material {
  id: number;
  name: string;
  mass: string;
  heatValue: string;
  category: string;
}

interface CategoryResult {
  category: "А" | "Б" | "В1" | "В2" | "В3" | "В4" | "Г" | "Д";
  totalFireLoad: number;
  specificFireLoad: number;
  description: string;
  recommendations: string[];
  requirements: string[];
}

const PRESET_MATERIALS = [
  { name: "Бумага, картон", heatValue: 16.5, category: "А" },
  { name: "Древесина", heatValue: 19.0, category: "А" },
  { name: "Хлопок, ткани", heatValue: 17.5, category: "А" },
  { name: "Бензин", heatValue: 44.0, category: "Б" },
  { name: "Этиловый спирт", heatValue: 27.0, category: "Б" },
  { name: "Дизельное топливо", heatValue: 43.0, category: "В" },
  { name: "Мазут", heatValue: 40.0, category: "В" },
  { name: "Полиэтилен", heatValue: 44.0, category: "Г" },
  { name: "Резина", heatValue: 33.0, category: "Г" },
];

const CATEGORY_DESCRIPTIONS: Record<string, { description: string; color: string }> = {
  "А": { description: "Повышенная взрывопожароопасность — горючие газы, ЛВЖ с tвсп ≤28°C", color: "bg-red-500" },
  "Б": { description: "Взрывопожароопасность — ЛВЖ с tвсп >28°C, горючие пыли", color: "bg-orange-500" },
  "В1": { description: "Пожароопасность (высокая) — удельная пожарная нагрузка >2200 МДж/м²", color: "bg-yellow-500" },
  "В2": { description: "Пожароопасность (умеренно высокая) — нагрузка 1401-2200 МДж/м²", color: "bg-yellow-400" },
  "В3": { description: "Пожароопасность (умеренная) — нагрузка 181-1400 МДж/м²", color: "bg-yellow-300" },
  "В4": { description: "Пожароопасность (низкая) — нагрузка 1-180 МДж/м²", color: "bg-green-400" },
  "Г": { description: "Умеренная пожароопасность — негорючие вещества в горячем состоянии", color: "bg-blue-400" },
  "Д": { description: "Пониженная пожароопасность — негорючие вещества в холодном состоянии", color: "bg-green-500" },
};

export default function ExplosionCategoryCalculator() {
  const [area, setArea] = useState("");
  const [hasGases, setHasGases] = useState("no");
  const [hasLVZH, setHasLVZH] = useState("no");
  const [hasHotProcesses, setHasHotProcesses] = useState("no");
  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, name: "", mass: "", heatValue: "", category: "А" }
  ]);
  const [result, setResult] = useState<CategoryResult | null>(null);

  const addMaterial = () => {
    const newId = Math.max(...materials.map(m => m.id)) + 1;
    setMaterials([...materials, { id: newId, name: "", mass: "", heatValue: "", category: "А" }]);
  };

  const removeMaterial = (id: number) => {
    if (materials.length > 1) {
      setMaterials(materials.filter(m => m.id !== id));
    }
  };

  const updateMaterial = (id: number, field: string, value: string) => {
    setMaterials(materials.map(m => {
      if (m.id === id) {
        const updated = { ...m, [field]: value };
        if (field === "name") {
          const preset = PRESET_MATERIALS.find(p => p.name === value);
          if (preset) {
            updated.heatValue = preset.heatValue.toString();
            updated.category = preset.category;
          }
        }
        return updated;
      }
      return m;
    }));
  };

  const calculate = () => {
    if (!area || parseFloat(area) <= 0) return;

    const areaNum = parseFloat(area);
    let totalFireLoad = 0;

    materials.forEach(m => {
      const mass = parseFloat(m.mass) || 0;
      const heatValue = parseFloat(m.heatValue) || 0;
      totalFireLoad += mass * heatValue;
    });

    const specificFireLoad = totalFireLoad / areaNum;

    let category: CategoryResult["category"];
    const recommendations: string[] = [];
    const requirements: string[] = [];

    if (hasGases === "yes") {
      category = "А";
      recommendations.push("Взрывозащищенное электрооборудование обязательно");
      recommendations.push("Система вентиляции с автоматикой");
      recommendations.push("Газоанализаторы с автоматическим отключением");
      requirements.push("АУПТ обязательна");
      requirements.push("СОУЭ не ниже 3-го типа");
    } else if (hasLVZH === "low") {
      category = "А";
      recommendations.push("Взрывозащищенное электрооборудование");
      recommendations.push("Аварийная вентиляция");
      requirements.push("АУПТ обязательна");
    } else if (hasLVZH === "high") {
      category = "Б";
      recommendations.push("Взрывозащищенное электрооборудование в зоне хранения");
      requirements.push("АУПТ рекомендована");
    } else if (hasHotProcesses === "yes" && specificFireLoad < 1) {
      category = "Г";
      recommendations.push("Защита от тепловых воздействий");
      recommendations.push("Усиленная вентиляция");
    } else if (specificFireLoad < 1) {
      category = "Д";
      recommendations.push("Базовые меры пожарной безопасности");
      recommendations.push("Первичные средства пожаротушения");
    } else if (specificFireLoad <= 180) {
      category = "В4";
      recommendations.push("Первичные средства пожаротушения");
      requirements.push("Огнетушители по нормам ППБ РК");
    } else if (specificFireLoad <= 1400) {
      category = "В3";
      recommendations.push("Пожарная сигнализация");
      recommendations.push("Увеличенное количество огнетушителей");
      requirements.push("АПС обязательна");
    } else if (specificFireLoad <= 2200) {
      category = "В2";
      recommendations.push("Автоматическая пожарная сигнализация");
      recommendations.push("Рассмотреть установку АУПТ");
      requirements.push("АПС обязательна");
      requirements.push("СОУЭ не ниже 2-го типа");
    } else {
      category = "В1";
      recommendations.push("Автоматическое пожаротушение");
      recommendations.push("Усиленная противопожарная защита");
      requirements.push("АУПТ обязательна");
      requirements.push("СОУЭ не ниже 3-го типа");
    }

    const catInfo = CATEGORY_DESCRIPTIONS[category];

    setResult({
      category,
      totalFireLoad,
      specificFireLoad,
      description: catInfo.description,
      recommendations,
      requirements,
    });
  };

  const reset = () => {
    setArea("");
    setHasGases("no");
    setHasLVZH("no");
    setHasHotProcesses("no");
    setMaterials([{ id: 1, name: "", mass: "", heatValue: "", category: "А" }]);
    setResult(null);
  };

  const exportResult = () => {
    if (!result) return;

    const content = `ОПРЕДЕЛЕНИЕ КАТЕГОРИИ ПОМЕЩЕНИЯ ПО ВЗРЫВОПОЖАРООПАСНОСТИ
=======================================================
Дата: ${new Date().toLocaleDateString("ru-RU")}

ИСХОДНЫЕ ДАННЫЕ:
- Площадь: ${area} м²
- Горючие газы: ${hasGases === "yes" ? "Да" : "Нет"}
- ЛВЖ: ${hasLVZH === "no" ? "Нет" : hasLVZH === "low" ? "tвсп ≤28°C" : "tвсп >28°C"}
- Горячие процессы: ${hasHotProcesses === "yes" ? "Да" : "Нет"}

ПОЖАРНАЯ НАГРУЗКА:
- Общая: ${result.totalFireLoad.toFixed(1)} МДж
- Удельная: ${result.specificFireLoad.toFixed(1)} МДж/м²

РЕЗУЛЬТАТ: КАТЕГОРИЯ ${result.category}
${result.description}

ТРЕБОВАНИЯ:
${result.requirements.map(r => `• ${r}`).join("\n") || "Базовые требования ППБ РК"}

РЕКОМЕНДАЦИИ:
${result.recommendations.map(r => `• ${r}`).join("\n")}

Основание: СП РК 2.02-101-2022
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `category_${result.category}_${new Date().toISOString().split("T")[0]}.txt`;
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
          <Flame className="mr-4 w-10 h-10 text-orange-600" />
          Категория помещения по взрывопожароопасности
        </h1>
        <p className="text-xl text-white font-bold max-w-2xl mx-auto">
          Определение категории по СП РК 2.02-101-2022
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Параметры помещения</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="area">Площадь помещения (м²)</Label>
                <Input
                  id="area"
                  type="number"
                  placeholder="например, 200"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <Label>Наличие горючих газов</Label>
                <Select value={hasGases} onValueChange={setHasGases}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Нет</SelectItem>
                    <SelectItem value="yes">Да (метан, пропан, водород и др.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Легковоспламеняющиеся жидкости (ЛВЖ)</Label>
                <Select value={hasLVZH} onValueChange={setHasLVZH}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Нет</SelectItem>
                    <SelectItem value="low">Да, с tвсп ≤28°C (бензин, ацетон)</SelectItem>
                    <SelectItem value="high">Да, с tвсп &gt;28°C (керосин, дизтопливо)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Горячие технологические процессы</Label>
                <Select value={hasHotProcesses} onValueChange={setHasHotProcesses}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Нет</SelectItem>
                    <SelectItem value="yes">Да (плавка, сварка, нагрев &gt;100°C)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Горючие материалы
                <Button size="sm" onClick={addMaterial}>
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {materials.map((material) => (
                <div key={material.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Материал #{material.id}</Label>
                    {materials.length > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => removeMaterial(material.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <Select
                    value={material.name}
                    onValueChange={(v) => updateMaterial(material.id, "name", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите материал" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Пользовательский...</SelectItem>
                      {PRESET_MATERIALS.map((m, idx) => (
                        <SelectItem key={idx} value={m.name}>
                          {m.name} ({m.heatValue} МДж/кг)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Масса (кг)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={material.mass}
                        onChange={(e) => updateMaterial(material.id, "mass", e.target.value)}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Теплота сгорания (МДж/кг)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={material.heatValue}
                        onChange={(e) => updateMaterial(material.id, "heatValue", e.target.value)}
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button onClick={calculate} className="flex-1 bg-orange-500 hover:bg-orange-600">
                  <Flame className="mr-2 w-4 h-4" />
                  Определить категорию
                </Button>
                <Button variant="outline" onClick={reset}>
                  <RefreshCw className="mr-2 w-4 h-4" />
                  Сброс
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Результат
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
                <div className={`p-6 rounded-lg text-center text-white ${CATEGORY_DESCRIPTIONS[result.category].color}`}>
                  <div className="text-5xl font-bold mb-2">
                    {result.category}
                  </div>
                  <div className="text-sm opacity-90">{result.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted border border-border rounded-lg text-center">
                    <div className="text-3xl font-black text-black dark:text-white">{result.totalFireLoad.toFixed(0)}</div>
                    <div className="text-sm text-black dark:text-white font-bold">МДж (общая нагрузка)</div>
                  </div>
                  <div className="p-4 bg-muted border border-border rounded-lg text-center">
                    <div className="text-3xl font-black text-black dark:text-white">{result.specificFireLoad.toFixed(1)}</div>
                    <div className="text-sm text-black dark:text-white font-bold">МДж/м² (удельная)</div>
                  </div>
                </div>

                {result.requirements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-black text-lg flex items-center text-red-700 dark:text-red-500">
                      <AlertTriangle className="mr-2 w-5 h-5" />
                      Обязательные требования
                    </h4>
                    <ul className="space-y-2 text-base font-bold text-black dark:text-white">
                      {result.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-red-600 mr-2 font-black">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-black text-lg flex items-center text-green-700 dark:text-green-500">
                    <CheckCircle className="mr-2 w-5 h-5" />
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
                  <Badge variant="outline">
                    Основание: СП РК 2.02-101-2022
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                Введите параметры и нажмите «Определить категорию»
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
