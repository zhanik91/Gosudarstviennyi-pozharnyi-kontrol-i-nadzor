import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Flame, Users, AlertTriangle, TrendingUp } from "lucide-react";

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const MONTHS = [
  { value: "2025-12", label: "Декабрь 2025" },
  { value: "2025-11", label: "Ноябрь 2025" },
  { value: "2025-10", label: "Октябрь 2025" },
  { value: "2026-01", label: "Январь 2026" },
];

interface ChartData {
  ok: boolean;
  period: string;
  form1: {
    regions: Array<{ region: string; fires: number; deaths: number; injured: number; damage: number }>;
    totals: { fires: number; deaths: number; injured: number; damage: number };
  };
  form2: {
    regions: Array<{ region: string; total: number }>;
    totals: { total: number };
  };
}

export default function CleanAnalytics() {
  const [period, setPeriod] = useState("2025-12");
  const numberFormatter = useMemo(() => new Intl.NumberFormat("ru-RU"), []);

  const { data, isLoading, isError, refetch } = useQuery<ChartData>({
    queryKey: ["/api/analytics/charts", period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/charts?period=${period}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics data");
      return res.json();
    },
  });

  const formatNumber = (value: number) => numberFormatter.format(value);
  const formatDamage = (value: number) => `${formatNumber(value)} тыс. ₸`;

  const form1Regions = data?.form1?.regions || [];
  const form1Totals = data?.form1?.totals || { fires: 0, deaths: 0, injured: 0, damage: 0 };
  const form2Regions = data?.form2?.regions || [];

  const allRegions = form1Regions;
  
  const pieData = form1Regions.map((r, i) => ({
    name: r.region.replace(" область", "").replace("Область ", ""),
    value: r.fires,
    fill: COLORS[i % COLORS.length],
  }));

  const victimData = [
    { name: "Погибшие", value: form1Totals.deaths, fill: "#ef4444" },
    { name: "Травмированные", value: form1Totals.injured, fill: "#f59e0b" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground" data-testid="text-page-title">Аналитика пожарной статистики</h2>
          <p className="text-muted-foreground" data-testid="text-page-subtitle">Визуализация данных форм отчётности</p>
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium" data-testid="label-period">Период:</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => refetch()} variant="outline" data-testid="button-refresh">
            Обновить
          </Button>
        </div>
      </div>

      {isError && (
        <Card data-testid="card-error" className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-4 text-destructive" data-testid="text-error-message">
            Не удалось загрузить данные. Проверьте соединение и попробуйте снова.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="cards-summary">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20" data-testid="card-fires">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Flame className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" data-testid="label-fires">Всего пожаров</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-fires-total">{formatNumber(form1Totals.fires)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20" data-testid="card-deaths">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Users className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" data-testid="label-deaths">Погибшие</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-deaths-total">{formatNumber(form1Totals.deaths)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20" data-testid="card-injured">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" data-testid="label-injured">Травмированные</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-injured-total">{formatNumber(form1Totals.injured)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20" data-testid="card-damage">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground" data-testid="label-damage">Ущерб</p>
                <p className="text-xl font-bold text-foreground" data-testid="text-damage-total">{formatDamage(form1Totals.damage)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="charts-grid">
        <Card data-testid="chart-regions-bar">
          <CardHeader>
            <CardTitle data-testid="title-regions-bar">Пожары по регионам</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="desc-regions-bar">Форма 1-ОСП: количество пожаров по всем регионам</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div data-testid="status-loading-regions" className="flex items-center justify-center h-[500px] text-muted-foreground">
                Загрузка...
              </div>
            ) : allRegions.length === 0 ? (
              <div data-testid="status-empty-regions" className="flex items-center justify-center h-[500px] text-muted-foreground">
                Нет данных за выбранный период
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(500, allRegions.length * 28)}>
                <BarChart data={allRegions} layout="vertical" margin={{ left: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" fontSize={11} tickFormatter={formatNumber} />
                  <YAxis 
                    type="category" 
                    dataKey="region" 
                    fontSize={10} 
                    width={115}
                    tickFormatter={(v) => v.replace(" область", "").replace("Область ", "")}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatNumber(value), "Пожаров"]}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="fires" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="chart-regions-pie">
          <CardHeader>
            <CardTitle data-testid="title-regions-pie">Распределение пожаров по регионам</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="desc-regions-pie">Доля каждого региона в общем количестве</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div data-testid="status-loading-pie" className="flex items-center justify-center h-[350px] text-muted-foreground">
                Загрузка...
              </div>
            ) : pieData.length === 0 ? (
              <div data-testid="status-empty-pie" className="flex items-center justify-center h-[350px] text-muted-foreground">
                Нет данных за выбранный период
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={40}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={10}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatNumber(value), "Пожаров"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="charts-victims-grid">
        <Card data-testid="chart-victims-bar">
          <CardHeader>
            <CardTitle data-testid="title-victims-bar">Жертвы пожаров</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="desc-victims-bar">Погибшие и травмированные за период</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div data-testid="status-loading-victims" className="flex items-center justify-center h-[300px] text-muted-foreground">
                Загрузка...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={victimData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" fontSize={11} tickFormatter={formatNumber} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={75} />
                  <Tooltip formatter={(value: number) => [formatNumber(value), "Человек"]} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {victimData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="chart-regions-victims">
          <CardHeader>
            <CardTitle data-testid="title-regions-victims">Последствия по регионам</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="desc-regions-victims">Все регионы по количеству жертв</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div data-testid="status-loading-casualties" className="flex items-center justify-center h-[400px] text-muted-foreground">
                Загрузка...
              </div>
            ) : allRegions.length === 0 ? (
              <div data-testid="status-empty-casualties" className="flex items-center justify-center h-[400px] text-muted-foreground">
                Нет данных за выбранный период
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(400, allRegions.length * 22)}>
                <BarChart 
                  data={[...form1Regions].sort((a, b) => (b.deaths + b.injured) - (a.deaths + a.injured))}
                  layout="vertical"
                  margin={{ left: 120 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" fontSize={11} tickFormatter={formatNumber} />
                  <YAxis 
                    type="category" 
                    dataKey="region" 
                    fontSize={10}
                    width={115}
                    tickFormatter={(v) => v.replace(" область", "").replace("Область ", "")}
                  />
                  <Tooltip formatter={(value: number, name: string) => [formatNumber(value), name === "deaths" ? "Погибшие" : "Травмированные"]} />
                  <Legend verticalAlign="top" />
                  <Bar dataKey="deaths" name="Погибшие" fill="#ef4444" stackId="a" />
                  <Bar dataKey="injured" name="Травмированные" fill="#f59e0b" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {form2Regions.length > 0 && (
        <Card data-testid="chart-form2-regions">
          <CardHeader>
            <CardTitle data-testid="title-form2-regions">Происшествия без пожара (Форма 2-ССГ)</CardTitle>
            <p className="text-sm text-muted-foreground" data-testid="desc-form2-regions">Все регионы</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(400, form2Regions.length * 28)}>
              <BarChart data={form2Regions} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" fontSize={11} tickFormatter={formatNumber} />
                <YAxis 
                  type="category" 
                  dataKey="region" 
                  fontSize={10}
                  width={115}
                  tickFormatter={(v) => v.replace(" область", "").replace("Область ", "")}
                />
                <Tooltip formatter={(value: number) => [formatNumber(value), "Происшествий"]} />
                <Bar dataKey="total" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
