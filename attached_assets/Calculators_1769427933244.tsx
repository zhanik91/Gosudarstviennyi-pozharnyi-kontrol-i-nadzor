import React from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calculator,
  Shield,
  Flame,
  Users,
  TrendingUp,
  FileText,
  ExternalLink,
  ArrowRight,
  Target,
  Zap,
  BookOpen,
} from "lucide-react";

export default function Calculators() {
  const calculators = [
    {
      id: "fire-extinguishers",
      title: "Калькулятор огнетушителей",
      description: "Расчёт количества и типов по ППБ РК (Прил. 3) и СТ РК 1487‑2006",
      icon: Calculator,
      color: "red",
      path: "/calculators/fire-extinguishers",
      features: [
        "Категории A/Б/В/Г/Д и площадь",
        "Минимум 2 на этаж",
        "АУПТ: −50% от расчёта",
        "Резерв на ТО, передвижные ОТ",
      ],
    },
    {
      id: "ngps",
      title: "Калькулятор НГПС",
      description: "Проверка обязательности НГПС по Перечню (Приказ МЧС №281) и ст. 53 Закона «О ГЗ»",
      icon: Shield,
      color: "blue",
      path: "/calculators/ngps",
      features: [
        "По Перечню (№281): отрасли/объекты",
        "Вне Перечня при >3 км — пост/договор",
        "Функциональные типы техники",
        "Штат: в смене / всего (3–4 караула)",
      ],
    },
    // Ниже — дополнительные калькуляторы (оставлять, только если маршруты существуют)
    {
      id: "fire-load",
      title: "Пожарная нагрузка",
      description: "Расчёт удельной пожарной нагрузки помещения",
      icon: Flame,
      color: "orange",
      path: "/calculators/fire-load",
      features: ["СП РК 2.02‑101", "Теплота сгорания", "Категории", "Материалы"],
    },
    {
      id: "evacuation",
      title: "Время эвакуации",
      description: "Расчёт времени эвакуации людей из помещения",
      icon: Users,
      color: "green",
      path: "/calculators/evacuation",
      features: ["Пропускная способность", "Скорость движения", "Узкие места", "Рекомендации"],
    },
    {
      id: "explosion",
      title: "Взрывопожароопасность",
      description: "Определение категории помещения по взрывопожароопасности",
      icon: TrendingUp,
      color: "purple",
      path: "/calculators/explosion",
      features: ["Категории А‑Д", "Параметры веществ", "Классификация", "Отчёт"],
    },
    {
      id: "audit",
      title: "Пожарный аудит",
      description: "Комплексная проверка соответствия требованиям пожарной безопасности",
      icon: Shield,
      color: "blue",
      path: "/calculators/audit",
      features: ["Критерии ППБ РК", "Системы безопасности", "Оценка рисков", "Рекомендации"],
    },
    {
      id: "risk",
      title: "Оценка пожарного риска",
      description: "Количественная оценка пожарного риска с учетом защитных мер",
      icon: TrendingUp,
      color: "red",
      path: "/calculators/risk",
      features: ["Методика ППБ РК", "Человеческий фактор", "Защитные системы", "Индивидуальный риск"],
    },
    // Карточка методички — отдельной страницей
    {
      id: "methodology",
      title: "Методичка (НПА и пояснения)",
      description: "Алгоритмы, примеры, ссылки на ППБ, СТ РК 1487‑2006, Перечень №281, Закон «О ГЗ»",
      icon: BookOpen,
      color: "teal",
      path: "/calculators/methodology",
      features: ["Якоря на пункты НПА", "Примеры расчётов", "Примечания и допуски", "Рекомендации"],
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<
      string,
      { bg: string; border: string; icon: string; button: string }
    > = {
      red: {
        bg: "bg-red-50 dark:bg-red-900/20",
        border: "border-red-200 dark:border-red-800",
        icon: "text-red-500",
        button: "bg-red-500 hover:bg-red-600",
      },
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-800",
        icon: "text-blue-500",
        button: "bg-blue-500 hover:bg-blue-600",
      },
      orange: {
        bg: "bg-orange-50 dark:bg-orange-900/20",
        border: "border-orange-200 dark:border-orange-800",
        icon: "text-orange-500",
        button: "bg-orange-500 hover:bg-orange-600",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-800",
        icon: "text-green-500",
        button: "bg-green-500 hover:bg-green-600",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        border: "border-purple-200 dark:border-purple-800",
        icon: "text-purple-500",
        button: "bg-purple-500 hover:bg-purple-600",
      },
      teal: {
        bg: "bg-teal-50 dark:bg-teal-900/20",
        border: "border-teal-200 dark:border-teal-800",
        icon: "text-teal-600",
        button: "bg-teal-600 hover:bg-teal-700",
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SEOHead 
        title="Калькуляторы пожарной безопасности - NewsFire"
        description="Точные калькуляторы по ППБ РК: огнетушители, НГПС, пожарная нагрузка, эвакуация, пожарный аудит и оценка рисков. Актуальные НПА и методики расчетов для Казахстана"
        keywords="калькуляторы пожарной безопасности, ППБ РК, огнетушители, НГПС, пожарная нагрузка, эвакуация, пожарный аудит, расчеты, Казахстан"
      />
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
            <Calculator className="mr-4 w-10 h-10 text-blue-500" />
            Калькуляторы пожарной безопасности
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-6">
            Инструменты с пояснениями и ссылками на НПА РК. Расчёты огнетушителей и НГПС — обновлены.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/calculators/methodology">
              <Button variant="outline">
                <FileText className="mr-2 w-4 h-4" />
                Методичка
              </Button>
            </Link>
            <Link href="/calculators/fire-extinguishers">
              <Button variant="outline">
                <ExternalLink className="mr-2 w-4 h-4" />
                ППБ РК (Прил. 3) — применено
              </Button>
            </Link>
            <Link href="/calculators/ngps">
              <Button variant="outline">
                <ExternalLink className="mr-2 w-4 h-4" />
                Перечень №281 / Закон «О ГЗ»
              </Button>
            </Link>
          </div>
        </div>

        {/* Карточки калькуляторов */}
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
                    <Target className="w-5 h-5 text-gray-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {calc.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                    {calc.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      {calc.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center text-xs text-gray-600 dark:text-gray-400"
                        >
                          <Zap className="w-3 h-3 mr-2 text-gray-400" />
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

        {/* Примечание */}
        <div className="mt-8">
          <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 dark:text-yellow-200 font-semibold text-sm">!</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                    Важное примечание
                  </h3>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                    Калькуляторы дают ориентировочный результат. Окончательные решения принимаются по
                    проектной документации.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}