import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, ArrowLeft, RefreshCw, Printer, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Material {
  name: string;
  heatValue: number; // МДж/кг
  category: string;
}

// Справочные данные по теплоте сгорания материалов (СП РК 2.02-101-2022)
const MATERIALS: Material[] = [
  { name: "Бумага, картон", heatValue: 16.5, category: "А" },
  { name: "Хлопок, ткани", heatValue: 17.5, category: "А" },
  { name: "Древесина (сосна)", heatValue: 20.0, category: "А" },
  { name: "Древесина (береза)", heatValue: 18.5, category: "А" },
  { name: "Этиловый спирт", heatValue: 27.0, category: "Б" },
  { name: "Бензин", heatValue: 44.0, category: "Б" },
  { name: "Дизельное топливо", heatValue: 43.0, category: "В" },
  { name: "Мазут", heatValue: 40.0, category: "В" },
  { name: "Трансформаторное масло", heatValue: 41.0, category: "В" },
  { name: "Полистирол", heatValue: 39.0, category: "Г" },
  { name: "Полиэтилен", heatValue: 44.0, category: "Г" },
  { name: "Резина", heatValue: 33.0, category: "Г" },
];

interface MaterialEntry {
  id: number;
  materialName: string;
  mass: string;
  heatValue: string;
  category: string;
  customName: string;
}

interface CalculationResult {
  totalFireLoad: number; // общая пожарная нагрузка, МДж
  area: number; // площадь помещения, м²
  specificFireLoad: number; // удельная пожарная нагрузка, МДж/м²
  category: "А" | "Б" | "В" | "Г" | "Д" | "Смешанная";
  recommendations: string[];
}

export default function FireLoadCalculator() {
  const [area, setArea] = useState<string>("");
  const [materials, setMaterials] = useState<MaterialEntry[]>([
    { id: 1, materialName: "", mass: "", heatValue: "", category: "А", customName: "" }
  ]);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const addMaterial = () => {
    const newId = Math.max(...materials.map(m => m.id)) + 1;
    setMaterials([...materials, { 
      id: newId, 
      materialName: "", 
      mass: "", 
      heatValue: "", 
      category: "А", 
      customName: "" 
    }]);
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
        
        // Автозаполнение при выборе из справочника
        if (field === "materialName" && value !== "custom") {
          const material = MATERIALS.find(mat => mat.name === value);
          if (material) {
            updated.heatValue = material.heatValue.toString();
            updated.category = material.category;
            updated.customName = "";
          }
        }
        
        return updated;
      }
      return m;
    }));
  };

  const calculate = () => {
    if (!area || parseFloat(area) <= 0) return;

    const roomArea = parseFloat(area);
    let totalFireLoad = 0;
    const categories = new Set<string>();

    // Расчёт общей пожарной нагрузки
    materials.forEach(material => {
      const mass = parseFloat(material.mass) || 0;
      const heatValue = parseFloat(material.heatValue) || 0;
      if (mass > 0 && heatValue > 0) {
        totalFireLoad += mass * heatValue;
        categories.add(material.category);
      }
    });

    // Удельная пожарная нагрузка
    const specificFireLoad = totalFireLoad / roomArea;

    // Определение категории помещения
    let category: "А" | "Б" | "В" | "Г" | "Д" | "Смешанная";
    if (categories.size > 1) {
      category = "Смешанная";
    } else if (categories.size === 1) {
      category = Array.from(categories)[0] as any;
    } else {
      category = "Д"; // нет горючих материалов
    }

    // Рекомендации
    const recommendations: string[] = [];
    
    if (specificFireLoad < 1) {
      recommendations.push("Низкая пожарная нагрузка - категория Д (негорючие материалы)");
    } else if (specificFireLoad < 180) {
      recommendations.push("Умеренная пожарная нагрузка - требуются базовые меры ПБ");
    } else if (specificFireLoad < 540) {
      recommendations.push("Повышенная пожарная нагрузка - усиленные меры ПБ, АУПТ рекомендована");
    } else {
      recommendations.push("Высокая пожарная нагрузка - обязательны АУПТ, СОУЭ, дополнительные выходы");
    }

    if (category === "Б" || category === "В") {
      recommendations.push("Категории Б/В: требуется взрывозащищенное электрооборудование");
    }

    if (category === "Смешанная") {
      recommendations.push("Смешанная категория: применяются требования для наиболее опасной категории");
    }

    recommendations.push(`Обоснование: СП РК 2.02-101-2022, табл. 1 (удельная пожарная нагрузка ${specificFireLoad.toFixed(1)} МДж/м²)`);

    setResult({
      totalFireLoad,
      area: roomArea,
      specificFireLoad,
      category,
      recommendations
    });
  };

  const reset = () => {
    setArea("");
    setMaterials([{ id: 1, materialName: "", mass: "", heatValue: "", category: "А", customName: "" }]);
    setResult(null);
  };

  const printPage = () => window.print();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Навигация */}
        <div className="mb-6 space-y-3">
          <Breadcrumbs items={[
            { label: "Калькуляторы", href: "/calculators" },
            { label: "Пожарная нагрузка" }
          ]} />
          <Link href="/calculators">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Назад к калькуляторам
            </Button>
          </Link>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
            <Flame className="mr-3 w-8 h-8 text-orange-500" />
            Калькулятор пожарной нагрузки
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Расчёт удельной пожарной нагрузки помещения по СП РК 2.02-101-2022
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Параметры расчёта</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Площадь помещения */}
                <div>
                  <Label htmlFor="area">Площадь помещения (м²)</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="например, 100"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>

                {/* Материалы */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Горючие материалы</h3>
                    <Button onClick={addMaterial} size="sm">
                      Добавить материал
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {materials.map((material, index) => (
                      <Card key={material.id} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                          <div className="md:col-span-2">
                            <Label>Материал</Label>
                            <Select 
                              value={material.materialName} 
                              onValueChange={(value) => updateMaterial(material.id, "materialName", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите материал" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="custom">Пользовательский...</SelectItem>
                                {MATERIALS.map((mat, idx) => (
                                  <SelectItem key={idx} value={mat.name}>
                                    {mat.name} ({mat.heatValue} МДж/кг)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {material.materialName === "custom" && (
                            <div>
                              <Label>Название</Label>
                              <Input
                                placeholder="Введите название"
                                value={material.customName}
                                onChange={(e) => updateMaterial(material.id, "customName", e.target.value)}
                              />
                            </div>
                          )}

                          <div>
                            <Label>Масса (кг)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={material.mass}
                              onChange={(e) => updateMaterial(material.id, "mass", e.target.value)}
                              min="0"
                              step="0.1"
                            />
                          </div>

                          <div>
                            <Label>Теплота сгорания (МДж/кг)</Label>
                            <Input
                              type="number"
                              placeholder="0"
                              value={material.heatValue}
                              onChange={(e) => updateMaterial(material.id, "heatValue", e.target.value)}
                              min="0"
                              step="0.1"
                            />
                          </div>

                          <div>
                            <Label>Категория</Label>
                            <Select 
                              value={material.category} 
                              onValueChange={(value) => updateMaterial(material.id, "category", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="А">А - твёрдые</SelectItem>
                                <SelectItem value="Б">Б - жидкости (tвсп &lt; 61°C)</SelectItem>
                                <SelectItem value="В">В - жидкости (tвсп &gt; 61°C)</SelectItem>
                                <SelectItem value="Г">Г - горючие газы</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            {materials.length > 1 && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => removeMaterial(material.id)}
                              >
                                Удалить
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Кнопки */}
                <div className="flex gap-3">
                  <Button onClick={calculate} className="flex-1">
                    <Flame className="mr-2 w-4 h-4" />
                    Рассчитать
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Сброс
                  </Button>
                  <Button variant="outline" onClick={printPage}>
                    <Printer className="mr-2 w-4 h-4" />
                    Печать
                  </Button>
                </div>

                {/* Результат */}
                {result && (
                  <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-200 mb-4">
                        Результаты расчёта
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-white dark:bg-orange-900/30 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {result.totalFireLoad.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">МДж</p>
                          <p className="text-xs">Общая пожарная нагрузка</p>
                        </div>

                        <div className="text-center p-4 bg-white dark:bg-orange-900/30 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {result.specificFireLoad.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">МДж/м²</p>
                          <p className="text-xs">Удельная пожарная нагрузка</p>
                        </div>

                        <div className="text-center p-4 bg-white dark:bg-orange-900/30 rounded-lg">
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {result.category}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Категория</p>
                          <p className="text-xs">Пожароопасности</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-orange-800 dark:text-orange-200">Рекомендации:</h4>
                        {result.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm text-orange-700 dark:text-orange-300">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Справочная информация */}
          <div className="xl:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Справочные данные</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm">Категории помещений:</h4>
                  <div className="space-y-2 text-xs">
                    <div><strong>А</strong> - твёрдые горючие вещества</div>
                    <div><strong>Б</strong> - жидкости с tвсп &lt; 61°C</div>
                    <div><strong>В</strong> - жидкости с tвсп &gt; 61°C</div>
                    <div><strong>Г</strong> - горючие газы</div>
                    <div><strong>Д</strong> - негорючие материалы</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 text-sm">Градация по нагрузке:</h4>
                  <div className="space-y-1 text-xs">
                    <div>&lt; 1 МДж/м² - низкая</div>
                    <div>1-180 МДж/м² - умеренная</div>
                    <div>180-540 МДж/м² - повышенная</div>
                    <div>&gt; 540 МДж/м² - высокая</div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    <AlertTriangle className="inline w-3 h-3 mr-1" />
                    Расчёт выполнен в соответствии с СП РК 2.02-101-2022
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}