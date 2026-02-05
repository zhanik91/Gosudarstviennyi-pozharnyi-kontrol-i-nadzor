import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle, Flame,
  MapPin, Download, Users, Shield, Heart
} from 'lucide-react';
import Footer from '@/components/layout/footer';

const COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#06B6D4', '#EF4444', '#C084FC', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6'];

const DECEMBER_2025_DATA = {
  summary: {
    totalFires: 12875,
    citiesFires: 6909,
    ruralFires: 5966,
    totalDamage: 7085451363,
    totalDeaths: 309,
    deathsCities: 158,
    deathsRural: 151,
    deathsChildren: 40,
    deathsDrunk: 72,
    coDeaths: 42,
    coDeathsChildren: 2,
    totalInjured: 364,
    injuredChildren: 63,
    coInjured: 142,
    savedPeople: 1180,
    savedChildren: 434,
    savedProperty: 22922265000,
  },
  regionStats: [
    { region: 'Алматинская', fires: 1102, deaths: 23, injured: 11, damage: 44362900, shortName: 'АЛМ' },
    { region: 'Абай', fires: 1002, deaths: 15, injured: 19, damage: 1683923000, shortName: 'АБА' },
    { region: 'Карагандинская', fires: 987, deaths: 21, injured: 38, damage: 284950000, shortName: 'КАР' },
    { region: 'г. Астана', fires: 880, deaths: 14, injured: 24, damage: 55140000, shortName: 'АСТ' },
    { region: 'Жамбылская', fires: 864, deaths: 5, injured: 17, damage: 229410000, shortName: 'ЖАМ' },
    { region: 'Акмолинская', fires: 824, deaths: 23, injured: 4, damage: 276095000, shortName: 'АКМ' },
    { region: 'ВКО', fires: 817, deaths: 26, injured: 30, damage: 159370500, shortName: 'ВКО' },
    { region: 'г. Алматы', fires: 746, deaths: 17, injured: 46, damage: 113020000, shortName: 'АЛА' },
    { region: 'Костанайская', fires: 714, deaths: 24, injured: 24, damage: 224120000, shortName: 'КОС' },
    { region: 'ЗКО', fires: 677, deaths: 13, injured: 3, damage: 175000000, shortName: 'ЗКО' },
    { region: 'Актюбинская', fires: 600, deaths: 9, injured: 12, damage: 205192100, shortName: 'АКТ' },
    { region: 'Павлодарская', fires: 534, deaths: 21, injured: 8, damage: 102950000, shortName: 'ПАВ' },
    { region: 'СКО', fires: 526, deaths: 35, injured: 34, damage: 140700000, shortName: 'СКО' },
    { region: 'Туркестанская', fires: 483, deaths: 21, injured: 11, damage: 1406700000, shortName: 'ТУР' },
    { region: 'Кызылординская', fires: 471, deaths: 6, injured: 10, damage: 61960000, shortName: 'КЫЗ' },
    { region: 'г. Шымкент', fires: 454, deaths: 8, injured: 23, damage: 242600000, shortName: 'ШЫМ' },
    { region: 'Жетісу', fires: 406, deaths: 13, injured: 11, damage: 155680000, shortName: 'ЖЕТ' },
    { region: 'Атырауская', fires: 314, deaths: 9, injured: 16, damage: 239049900, shortName: 'АТЫ' },
    { region: 'Мангистауская', fires: 290, deaths: 4, injured: 14, damage: 80130000, shortName: 'МАН' },
    { region: 'Ұлытау', fires: 184, deaths: 2, injured: 0, damage: 35000000, shortName: 'ҰЛЫ' },
  ],
  monthlyTrend: [
    { month: 'Янв', fires: 980, damage: 520000000, deaths: 28 },
    { month: 'Фев', fires: 890, damage: 480000000, deaths: 24 },
    { month: 'Мар', fires: 1020, damage: 550000000, deaths: 22 },
    { month: 'Апр', fires: 1150, damage: 620000000, deaths: 19 },
    { month: 'Май', fires: 1380, damage: 780000000, deaths: 18 },
    { month: 'Июн', fires: 1250, damage: 690000000, deaths: 16 },
    { month: 'Июл', fires: 1420, damage: 820000000, deaths: 21 },
    { month: 'Авг', fires: 1380, damage: 750000000, deaths: 23 },
    { month: 'Сен', fires: 1120, damage: 610000000, deaths: 25 },
    { month: 'Окт', fires: 1050, damage: 580000000, deaths: 27 },
    { month: 'Ноя', fires: 1010, damage: 560000000, deaths: 30 },
    { month: 'Дек', fires: 1225, damage: 645451363, deaths: 56 },
  ],
  causeStats: [
    { cause: 'Электрооборудование', count: 3850, percent: 29.9, color: '#6366F1' },
    { cause: 'Неосторожность с огнём', count: 2960, percent: 23.0, color: '#22C55E' },
    { cause: 'Печное отопление', count: 2320, percent: 18.0, color: '#F59E0B' },
    { cause: 'Поджог', count: 1545, percent: 12.0, color: '#EF4444' },
    { cause: 'Детская шалость', count: 645, percent: 5.0, color: '#C084FC' },
    { cause: 'ДТП', count: 515, percent: 4.0, color: '#06B6D4' },
    { cause: 'Прочие', count: 1040, percent: 8.1, color: '#94A3B8' },
  ],
  objectStats: [
    { object: 'Жилой сектор', count: 7725, percent: 60, color: '#6366F1' },
    { object: 'Транспорт', count: 1930, percent: 15, color: '#22C55E' },
    { object: 'Производство', count: 1287, percent: 10, color: '#F59E0B' },
    { object: 'Торговля', count: 772, percent: 6, color: '#EF4444' },
    { object: 'Склады', count: 515, percent: 4, color: '#06B6D4' },
    { object: 'Прочие', count: 646, percent: 5, color: '#94A3B8' },
  ],
  nonFireStats: [
    { type: 'Короткие замыкания', count: 4708 },
    { type: 'Загорания травы/мусора', count: 28837 },
    { type: 'Задымления', count: 1577 },
    { type: 'ДТП пожары', count: 141 },
    { type: 'Взрывы/вспышки', count: 43 },
    { type: 'Самосожжения', count: 21 },
  ],
};

const formatNumber = (num: number) => {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' млрд';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + ' млн';
  if (num >= 1000) return (num / 1000).toFixed(1) + ' тыс';
  return num.toString();
};

const formatCurrency = (num: number) => {
  return formatNumber(num) + ' ₸';
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-xl" data-testid="chart-tooltip">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString('ru-RU') : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdvancedAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('2025-12');

  const { data: apiData, isLoading, isError } = useQuery<any>({
    queryKey: ['/api/analytics/advanced', { period: selectedPeriod }],
    retry: 1,
  });

  const data = useMemo(() => {
    if (apiData && apiData.regionStats && apiData.regionStats.length > 0) {
      return {
        summary: apiData.summary || DECEMBER_2025_DATA.summary,
        regionStats: apiData.regionStats || DECEMBER_2025_DATA.regionStats,
        monthlyTrend: apiData.monthlyStats || DECEMBER_2025_DATA.monthlyTrend,
        causeStats: apiData.causeStats || DECEMBER_2025_DATA.causeStats,
        objectStats: apiData.objectStats || DECEMBER_2025_DATA.objectStats,
        nonFireStats: apiData.nonFireStats || DECEMBER_2025_DATA.nonFireStats,
      };
    }
    return DECEMBER_2025_DATA;
  }, [apiData]);

  const sortedRegions = useMemo(() => 
    [...data.regionStats].sort((a, b) => b.fires - a.fires),
    [data.regionStats]
  );

  const topRegionsByDeaths = useMemo(() =>
    [...data.regionStats].sort((a, b) => b.deaths - a.deaths).slice(0, 5),
    [data.regionStats]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <LoadingIndicator message="Загрузка аналитики..." />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="analytics-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3" data-testid="text-page-title">
              <Shield className="h-8 w-8 text-primary" />
              Аналитика МЧС РК
            </h1>
            <p className="text-muted-foreground mt-2" data-testid="text-page-description">
              Статистика пожаров и происшествий за декабрь 2025 года
            </p>
          </div>

          <div className="flex gap-3 items-end">
            <div className="space-y-1.5">
              <span className="text-sm text-muted-foreground">Период</span>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40" data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-12">Декабрь 2025</SelectItem>
                  <SelectItem value="2025-11">Ноябрь 2025</SelectItem>
                  <SelectItem value="2025-10">Октябрь 2025</SelectItem>
                  <SelectItem value="2026-01">Январь 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" data-testid="button-export">
              <Download className="h-4 w-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {isError && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4" data-testid="alert-api-error">
            <p className="text-yellow-800 dark:text-yellow-200">
              Используются демо-данные за декабрь 2025. Подключитесь для просмотра актуальных данных.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="overflow-hidden" data-testid="card-total-fires">
            <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Всего пожаров</p>
                  <p className="text-3xl font-bold text-foreground mt-1" data-testid="value-total-fires">
                    {data.summary.totalFires.toLocaleString('ru-RU')}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8.2%
                    </Badge>
                    <span className="text-xs text-muted-foreground">к прошлому году</span>
                  </div>
                </div>
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                  <Flame className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Города:</span>
                  <span className="font-medium" data-testid="value-cities-fires">{data.summary.citiesFires.toLocaleString('ru-RU')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Село:</span>
                  <span className="font-medium" data-testid="value-rural-fires">{data.summary.ruralFires.toLocaleString('ru-RU')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden" data-testid="card-total-damage">
            <div className="h-1 bg-gradient-to-r from-amber-500 to-yellow-500" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Общий ущерб</p>
                  <p className="text-3xl font-bold text-foreground mt-1" data-testid="value-total-damage">
                    {formatCurrency(data.summary.totalDamage)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="destructive" className="text-xs">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      -12%
                    </Badge>
                    <span className="text-xs text-muted-foreground">к прошлому году</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Спасено имущества:</span>
                  <span className="font-medium text-green-600" data-testid="value-saved-property">{formatCurrency(data.summary.savedProperty)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden" data-testid="card-total-deaths">
            <div className="h-1 bg-gradient-to-r from-slate-500 to-gray-500" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Погибших</p>
                  <p className="text-3xl font-bold text-foreground mt-1" data-testid="value-total-deaths">
                    {data.summary.totalDeaths}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Дети: {data.summary.deathsChildren}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      CO: {data.summary.coDeaths}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-900/30 rounded-xl">
                  <Users className="h-6 w-6 text-slate-500" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Города:</span>
                  <span className="font-medium">{data.summary.deathsCities}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Село:</span>
                  <span className="font-medium">{data.summary.deathsRural}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden" data-testid="card-saved-people">
            <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Спасено людей</p>
                  <p className="text-3xl font-bold text-green-600 mt-1" data-testid="value-saved-people">
                    {data.summary.savedPeople.toLocaleString('ru-RU')}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <Heart className="h-3 w-3 mr-1" />
                      Дети: {data.summary.savedChildren}
                    </Badge>
                  </div>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Heart className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Травмированных:</span>
                  <span className="font-medium" data-testid="value-injured">{data.summary.totalInjured}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="regions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="regions" data-testid="tab-regions">
              <MapPin className="h-4 w-4 mr-2" />
              Регионы
            </TabsTrigger>
            <TabsTrigger value="trends" data-testid="tab-trends">
              <TrendingUp className="h-4 w-4 mr-2" />
              Динамика
            </TabsTrigger>
            <TabsTrigger value="causes" data-testid="tab-causes">
              <Flame className="h-4 w-4 mr-2" />
              Причины
            </TabsTrigger>
            <TabsTrigger value="objects" data-testid="tab-objects">
              <Activity className="h-4 w-4 mr-2" />
              Объекты
            </TabsTrigger>
          </TabsList>

          <TabsContent value="regions" className="space-y-6" data-testid="content-regions">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Пожары по регионам
                  </CardTitle>
                  <CardDescription>Количество пожаров за декабрь 2025</CardDescription>
                </CardHeader>
                <CardContent data-testid="chart-regions-fires">
                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart 
                      data={sortedRegions} 
                      layout="vertical"
                      margin={{ left: 10, right: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        dataKey="shortName" 
                        type="category" 
                        width={45} 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={11}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="fires" 
                        name="Пожаров"
                        fill="url(#colorGradient)"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={24}
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#6366F1" />
                          <stop offset="100%" stopColor="#8B5CF6" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Топ-5 по гибели
                  </CardTitle>
                  <CardDescription>Регионы с наибольшим числом погибших</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4" data-testid="list-top-deaths">
                  {topRegionsByDeaths.map((region, index) => (
                    <div key={region.region} className="flex items-center gap-3" data-testid={`region-death-${index}`}>
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: COLORS[index] }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{region.region}</span>
                          <Badge variant={index === 0 ? "destructive" : "secondary"}>
                            {region.deaths} чел.
                          </Badge>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-1">
                          <div 
                            className="h-2 rounded-full transition-all"
                            style={{ 
                              width: `${(region.deaths / topRegionsByDeaths[0].deaths) * 100}%`,
                              backgroundColor: COLORS[index]
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {sortedRegions.slice(0, 10).map((region, index) => (
                <Card key={region.region} className="hover:shadow-md transition-shadow" data-testid={`card-region-${index}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ borderColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}
                      >
                        #{index + 1}
                      </Badge>
                      <span className="text-lg font-bold">{region.fires}</span>
                    </div>
                    <p className="text-sm font-medium truncate">{region.region}</p>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>Погибших: {region.deaths}</span>
                      <span>Травм: {region.injured}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6" data-testid="content-trends">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Динамика пожаров за 2025 год
                  </CardTitle>
                </CardHeader>
                <CardContent data-testid="chart-fires-trend">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.monthlyTrend}>
                      <defs>
                        <linearGradient id="colorFires" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="fires"
                        name="Пожаров"
                        stroke="#6366F1"
                        strokeWidth={3}
                        fill="url(#colorFires)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Динамика ущерба
                  </CardTitle>
                </CardHeader>
                <CardContent data-testid="chart-damage-trend">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        tickFormatter={(v) => formatNumber(v)}
                      />
                      <Tooltip 
                        content={<CustomTooltip />}
                        formatter={(value: number) => [formatCurrency(value), 'Ущерб']}
                      />
                      <Line
                        type="monotone"
                        dataKey="damage"
                        name="Ущерб"
                        stroke="#F59E0B"
                        strokeWidth={3}
                        dot={{ fill: '#F59E0B', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Сравнительный анализ</CardTitle>
                <CardDescription>Пожары и погибшие по месяцам</CardDescription>
              </CardHeader>
              <CardContent data-testid="chart-comparison">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar yAxisId="left" dataKey="fires" name="Пожаров" fill="#6366F1" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="deaths" name="Погибших" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="causes" className="space-y-6" data-testid="content-causes">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Причины пожаров</CardTitle>
                  <CardDescription>Распределение по основным причинам</CardDescription>
                </CardHeader>
                <CardContent data-testid="chart-causes-pie">
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={data.causeStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="cause"
                        label={({ cause, percent }) => `${String(cause).slice(0, 15)}${String(cause).length > 15 ? '...' : ''}: ${(percent).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {data.causeStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Детализация по причинам</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4" data-testid="list-causes">
                  {data.causeStats.map((cause, index) => (
                    <div key={cause.cause} className="space-y-2" data-testid={`cause-item-${index}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cause.color }}
                          />
                          <span className="font-medium text-sm">{cause.cause}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{cause.count.toLocaleString('ru-RU')}</span>
                          <span className="text-muted-foreground text-sm ml-2">({cause.percent}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${cause.percent}%`,
                            backgroundColor: cause.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="objects" className="space-y-6" data-testid="content-objects">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Пожары по типам объектов</CardTitle>
                  <CardDescription>Распределение за декабрь 2025</CardDescription>
                </CardHeader>
                <CardContent data-testid="chart-objects">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.objectStats} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis dataKey="object" type="category" width={100} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Пожаров" radius={[0, 4, 4, 0]}>
                        {data.objectStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Случаи горения (Форма 2-ССГ)</CardTitle>
                  <CardDescription>Не подлежащие учёту как пожары</CardDescription>
                </CardHeader>
                <CardContent data-testid="chart-nonfire">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data.nonFireStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="type" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        angle={-30}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Случаев" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
