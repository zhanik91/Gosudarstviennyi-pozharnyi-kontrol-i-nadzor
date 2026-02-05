import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Shield,
  Flame,
  ArrowRight,
  Target,
  Zap,
} from "lucide-react";

export default function CalculatorsPage() {
  const calculators = [
    {
      id: "fire-extinguishers",
      title: "Калькулятор первичных средств пожаротушения",
      description: "Расчёт количества и типов огнетушителей по ППБ РК (Прил. 3) и СТ РК 1487‑2006",
      icon: Calculator,
      color: "red",
      path: "/calculators/fire-extinguishers",
      features: [
        "Категории A/Б/В/Г/Д и площадь",
        "Минимум 2 на этаж",
        "АУПТ: −50% от расчёта",
        "Резерв на ТО",
      ],
    },
    {
      id: "ngps",
      title: "Калькулятор ПСС (НГПС)",
      description: "Проверка обязательности НГПС по Перечню (Приказ МЧС №281) и ст. 53 Закона «О ГЗ»",
      icon: Shield,
      color: "blue",
      path: "/calculators/ngps",
      features: [
        "По Перечню (№281): отрасли/объекты",
        "Вне Перечня при >3 км — пост/договор",
        "Функциональные типы техники",
        "Штат: в смене / всего",
      ],
    },
    {
      id: "explosion-category",
      title: "Категория помещения по взрывопожароопасности",
      description: "Определение категории помещения (А, Б, В1-В4, Г, Д) по СП РК 2.02-101-2022",
      icon: Flame,
      color: "orange",
      path: "/calculators/explosion-category",
      features: [
        "Категории А-Д",
        "Параметры веществ",
        "Расчёт пожарной нагрузки",
        "Рекомендации по ПБ",
      ],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; icon: string; button: string }> = {
      red: {
        bg: "bg-red-50 dark:bg-card",
        border: "border-red-200 dark:border-red-900",
        icon: "text-red-500",
        button: "bg-red-500 hover:bg-red-600",
      },
      blue: {
        bg: "bg-blue-50 dark:bg-card",
        border: "border-blue-200 dark:border-blue-900",
        icon: "text-blue-500",
        button: "bg-blue-500 hover:bg-blue-600",
      },
      orange: {
        bg: "bg-orange-50 dark:bg-card",
        border: "border-orange-200 dark:border-orange-900",
        icon: "text-orange-500",
        button: "bg-orange-500 hover:bg-orange-600",
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-4 flex items-center justify-center">
          <Calculator className="mr-4 w-10 h-10 text-primary" />
          Калькуляторы пожарной безопасности
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Инструменты расчёта по НПА Республики Казахстан для специалистов МЧС
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {calculators.map((calc) => {
          const Icon = calc.icon;
          const color = getColorClasses(calc.color);

          return (
            <Card
              key={calc.id}
              className={`${color.bg} ${color.border} border-2 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`w-8 h-8 ${color.icon}`} />
                  <Target className="w-5 h-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  {calc.title}
                </CardTitle>
                <CardDescription className="text-sm text-foreground/70">
                  {calc.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="space-y-1">
                    {calc.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center text-xs text-foreground/60"
                      >
                        <Zap className="w-3 h-3 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Link href={calc.path}>
                    <Button className={`w-full ${color.button} text-white`}>
                      Открыть
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-yellow-50 dark:bg-card border-yellow-200 dark:border-yellow-900">
        <CardContent className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 dark:text-yellow-400 font-semibold text-sm">!</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Важное примечание
              </h3>
              <p className="text-foreground/70 text-sm">
                Калькуляторы дают ориентировочный результат на основе НПА РК. 
                Окончательные решения принимаются по проектной документации и требуют согласования.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
