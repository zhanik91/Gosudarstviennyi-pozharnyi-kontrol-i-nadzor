import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { FileText, ArrowLeft, Calculator, Shield, ExternalLink, Download, Book, AlertTriangle } from "lucide-react";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function CalculatorsMethodology() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Навигация */}
        <div className="mb-6 space-y-3">
          <Breadcrumbs items={[
            { label: "Калькуляторы", href: "/calculators" },
            { label: "Методичка" }
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
            <FileText className="mr-3 w-8 h-8 text-blue-500" />
            Методичка по расчетам ПБ РК
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Подробное руководство по расчету огнетушителей и НГПС с обоснованиями и ссылками на нормативы
          </p>
        </div>

        {/* Быстрая навигация */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/calculators/fire-extinguishers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Calculator className="mx-auto w-8 h-8 text-red-500 mb-3" />
                <h3 className="font-semibold text-lg mb-2">Калькулятор огнетушителей</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Перейти к расчету</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/calculators/ngps">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <Shield className="mx-auto w-8 h-8 text-blue-500 mb-3" />
                <h3 className="font-semibold text-lg mb-2">Калькулятор НГПС</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Перейти к расчету</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Содержание методички */}
        <div className="space-y-8">
          {/* Нормативные документы */}
          <Card id="normy">
            <CardHeader>
              <CardTitle className="text-xl">1. Нормативные документы</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>Правила пожарной безопасности РК, 2022</strong> (ППБ, Приказ МЧС №55 от 21.02.2022), Приложение 3</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>СТ РК 1487-2006</strong> «Техника пожарная. Огнетушители. Требования к эксплуатации»</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>СП РК 2.02-101-2022</strong> (категории A/Б/В/Г/Д; функциональные классы)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>Перечень объектов с обязательной НГПС</strong> — <strong>Приказ МЧС РК №281</strong> от 29.05.2023</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>ППБ РК (Приказ №55)</strong>, п. 7 — организация НГПС на объектах из Перечня</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>Правила осуществления деятельности НГПС</strong> — Приказ МВД РК №782 от 07.11.2014</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold mr-2">•</span>
                  <span><strong>Закон РК «О гражданской защите»</strong>, ст. 53 — оснащение/штаты не ниже ГПС; договор допускается</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Огнетушители */}
          <Card id="extinguishers">
            <CardHeader>
              <CardTitle className="text-xl">2. Огнетушители — алгоритм и ключевые правила</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Алгоритм расчета:</strong> определить категорию помещения (A/Б/В/Г/Д) и классы пожара → рассчитать базовое число по площади → учесть минимумы и послабления → выбрать тип/массу и места установки → проверить расстояния → учесть резерв и обслуживание.
              </p>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg" id="m-ppa3p8">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Минимум 2 переносных огнетушителя на каждом этаже
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Обязательно для всех общественных и производственных зданий (ППБ, Прил. 3)
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg" id="m-ppa3p9">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Исключение для категории Д ≤ 100 м²
                  </h4>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Помещения категории Д площадью не более 100 м² допускается не оснащать огнетушителями
                  </p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg" id="m-ppa3p13">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    При наличии АУПТ — сокращение на 50%
                  </h4>
                  <p className="text-orange-700 dark:text-orange-300 text-sm">
                    При установленном автоматическом пожаротушении можно сократить количество ручных огнетушителей, но не ниже поэтажного минимума
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg" id="m-ppa3p14">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    Максимальные расстояния до ближайшего огнетушителя
                  </h4>
                  <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-1">
                    <li>• Общественные здания: 20 м</li>
                    <li>• Категория A/Б/В: 30 м</li>
                    <li>• Категория Г: 40 м</li>
                    <li>• Категория Д: 70 м</li>
                  </ul>
                </div>

                {/* Пожарные шкафы */}
                <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg" id="m-cabinet">
                  <h4 className="font-semibold text-sky-800 dark:text-sky-200 mb-2">
                    Пожарные шкафы: не менее 2 огнетушителей ≥ 5 кг
                  </h4>
                  <p className="text-sky-700 dark:text-sky-300 text-sm">
                    Пожарные шкафы (ПК) устанавливаются так, чтобы в них размещались комплект пожарного крана и <strong>не менее двух ручных огнетушителей</strong> с массой заряда <strong>не менее 5 кг</strong>. Требуется пломбирование запорно‑пускового устройства. (ППБ РК, требования к ПК)
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg" id="m-st1487p85">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Резерв на время технического обслуживания
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Огнетушители, отправленные на перезарядку или ремонт, должны заменяться заряженными резервными (СТ РК 1487, п. 8.5). Рекомендуется держать запас ~10% от общего парка.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Передвижные огнетушители
                </h4>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  При общей площади помещений {'>'}500 м² или риске крупных очагов рекомендуется дополнительно установить передвижные огнетушители (ОП-25/50 на тележке).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* НГПС */}
          <Card id="ngps">
            <CardHeader>
              <CardTitle className="text-xl">3. НГПС — когда обязательна и как рассчитать</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg" id="m-mchs281">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                    Обязательность по Перечню (Приказ МЧС №281)
                  </h4>
                  <p className="text-red-700 dark:text-red-300 text-sm">
                    НГПС создается в обязательном порядке на объектах, включенных в Перечень (№281): нефтегаз, химия, энергетика, горнодобыча, аэропорты, склады ГСМ и др. Конкретизация — по формулировкам Перечня.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    Удалённость и рекомендации
                  </h4>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Если объект не входит в Перечень, но находится удаленно от ближайшей ПЧ ({'>'}3 км) и имеет опасные категории A/Б/В — рекомендуется организовать <strong>пожарный пост</strong> (без техники) или заключить договор с НГПС/ГПС.
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg" id="m-z53">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    Требования к оснащению (Закон «О ГЗ», ст. 53)
                  </h4>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    НГПС по оснащению и штатной численности не должна уступать ГПС. Допускается заключение договора с аккредитованной НГПС/ГПС.
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    Виды подразделений НГПС
                  </h4>
                  <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-1">
                    <li>• <strong>Пожарная часть</strong> — с выездной техникой (автоцистерны, спецавтомобили)</li>
                    <li>• <strong>Пожарный пост</strong> — без техники (дежурные с первичными средствами)</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    Ориентировочная численность штата
                  </h4>
                  <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-1">
                    <li>• 1 пожарный автомобиль → ~15–18 чел. (круглосуточно)</li>
                    <li>• 2 пожарных автомобиля → ~24–30 чел.</li>
                    <li>• 3 пожарных автомобиля → 40+ чел.</li>
                    <li>• Пожарный пост → ~8–10 чел.</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Примеры расчетов */}
          <Card id="examples">
            <CardHeader>
              <CardTitle className="text-xl">4. Примеры расчетов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-red-600 dark:text-red-400">Огнетушители</h4>

                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <p className="font-medium text-sm">Офис 250 м², кат. В, без АУПТ</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">→ ≈ 3 ОП-5; расстояние ≤ 20 м</p>
                  </div>

                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <p className="font-medium text-sm">Склад Б 600 м²</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">→ ≈ 12 ОТ + рекомендовать ОП-25/50</p>
                  </div>

                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <p className="font-medium text-sm">Цех В 1200 м² с АУПТ</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">→ базово 12, с −50% = 6 шт., но ≥ 2/этаж</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-lg text-blue-600 dark:text-blue-400">НГПС</h4>

                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <p className="font-medium text-sm">Нефтебаза, любая площадь</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">→ НГПС обязательна по Перечню (№281)</p>
                  </div>

                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <p className="font-medium text-sm">Прочее производство, 4000 м², В, 5 км</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">→ Объект вне Перечня: рекомендован пожарный пост или договор с НГПС/ГПС при удалённости {'>'} 3 км</p>
                  </div>

                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded">
                    <p className="font-medium text-sm">Административное здание, 2000 м², 10 км</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">→ НГПС не обязательна; при удалённости {'>'}3 км — рекомендован пожарный пост</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Заключение */}
          <Card>
            <CardContent className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-800 dark:text-blue-200 text-sm mb-4">
                  <strong>Важное примечание:</strong> Калькуляторы дают ориентировочный нормативный результат на основе действующих требований ППБ РК и других НПА. Окончательные решения должны приниматься на основе проектной документации и согласовываться с органами по чрезвычайным ситуациям.
                </p>
                <div className="pt-3 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-blue-700 dark:text-blue-300 text-xs">
                    <strong>Актуализация:</strong> Методика актуальна на {new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })} г. 
                    Основано на ППБ РК 2022, СП РК 2.02-101-2022 и других действующих нормативах.
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