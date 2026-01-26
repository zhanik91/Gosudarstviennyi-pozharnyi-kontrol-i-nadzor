import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DateRangeField } from "@/components/ui/date-range-field";
import { usePeriodStore } from "@/hooks/use-period-store";
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
  LineChart,
  Line,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function SimpleAnalytics() {
  const { store, updatePreset } = usePeriodStore();
  const [includeOrgTree, setIncludeOrgTree] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    periodFrom: store.analytics.from,
    periodTo: store.analytics.to,
    includeOrgTree: false,
  });

  const handleBuildCharts = () => {
    setAppliedFilters({
      periodFrom: store.analytics.from,
      periodTo: store.analytics.to,
      includeOrgTree,
    });
  };

  const applyAnalyticsPeriod = (next: { from: string; to: string }) => {
    updatePreset("analytics", next);
    setAppliedFilters((prev) => ({
      ...prev,
      periodFrom: next.from,
      periodTo: next.to,
    }));
  };

  const reportPeriodLabel = useMemo(() => {
    const from = store.report.from || "начало";
    const to = store.report.to || "настоящее время";
    return `${from} — ${to}`;
  }, [store.report.from, store.report.to]);

  const journalPeriodLabel = useMemo(() => {
    const from = store.journal.from || "начало";
    const to = store.journal.to || "настоящее время";
    return `${from} — ${to}`;
  }, [store.journal.from, store.journal.to]);

  const queryParams = new URLSearchParams();
  if (appliedFilters.periodFrom) {
    queryParams.set("periodFrom", appliedFilters.periodFrom);
  }
  if (appliedFilters.periodTo) {
    queryParams.set("periodTo", appliedFilters.periodTo);
  }
  queryParams.set("includeChildren", appliedFilters.includeOrgTree ? "true" : "false");
  const analyticsUrl = `/api/analytics/forms${queryParams.toString() ? `?${queryParams}` : ""}`;

  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    error: analyticsError,
  } = useQuery({
    queryKey: [analyticsUrl],
  });

  const form1Monthly = (analytics as any)?.form1?.monthly ?? [];
  const form1Locality = (analytics as any)?.form1?.locality ?? [];
  const form1Totals = (analytics as any)?.form1?.totals ?? { deaths: 0, injured: 0, damage: 0 };

  const form2Causes = (analytics as any)?.form2?.causes ?? [];
  const form2Regions = (analytics as any)?.form2?.regions ?? [];

  const form3Causes = (analytics as any)?.form3?.causes ?? [];
  const form3TopCauses = (analytics as any)?.form3?.topCauses ?? [];

  const form4Objects = (analytics as any)?.form4?.objects ?? [];
  const form4Comparison = (analytics as any)?.form4?.comparison ?? {
    current: 0,
    previous: 0,
    delta: 0,
    percent: null,
  };

  const form5Locality = (analytics as any)?.form5?.locality ?? [];

  const form6Monthly = (analytics as any)?.form6?.monthly ?? [];
  const form6Regions = (analytics as any)?.form6?.regions ?? [];

  const form7Totals = (analytics as any)?.form7?.totals ?? { deaths: 0, injured: 0 };
  const form7Regions = (analytics as any)?.form7?.regions ?? [];

  const form7TotalsChart = [
    { name: "Погибшие", value: Number(form7Totals.deaths) || 0 },
    { name: "Травмированные", value: Number(form7Totals.injured) || 0 },
  ];

  const comparisonChart = [
    { name: "Текущий период", value: Number(form4Comparison.current) || 0 },
    { name: "Прошлый период", value: Number(form4Comparison.previous) || 0 },
  ];

  const displayPeriodFrom = appliedFilters.periodFrom || "начало";
  const displayPeriodTo = appliedFilters.periodTo || "настоящее время";
  const periodLabel = `${displayPeriodFrom} — ${displayPeriodTo}`;
  const tooltipLabelFormatter = (label: string | number) => `${label} (${periodLabel})`;
  const analyticsErrorMessage =
    analyticsError instanceof Error ? analyticsError.message : "Не удалось загрузить данные аналитики.";

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Сводная аналитика по формам</h2>
        <p className="text-muted-foreground">Ключевые показатели форм 1‑ОСП…7‑CO</p>
      </div>

      {isAnalyticsError && (
        <Card className="border border-destructive/40 bg-destructive/10">
          <CardContent className="p-4 text-sm text-destructive">
            Не удалось загрузить аналитику. Проверьте соединение или попробуйте обновить страницу.{" "}
            <span className="text-destructive/80">{analyticsErrorMessage}</span>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Параметры диаграмм</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-foreground mb-2">Период</Label>
              <DateRangeField
                from={store.analytics.from}
                to={store.analytics.to}
                onChange={({ from, to }) => updatePreset("analytics", { from, to })}
                className="grid grid-cols-1 gap-3 md:grid-cols-2"
              />
            </div>

            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="chartOrgTree"
                  checked={includeOrgTree}
                  onCheckedChange={(checked) => setIncludeOrgTree(checked as boolean)}
                  data-testid="checkbox-chart-org-tree"
                />
                <Label htmlFor="chartOrgTree" className="text-sm text-foreground">
                  По дереву
                </Label>
              </div>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleBuildCharts} data-testid="button-build-charts">
                Построить
              </Button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => applyAnalyticsPeriod(store.report)}
              data-testid="button-use-report-period"
            >
              Использовать период отчёта
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => applyAnalyticsPeriod(store.journal)}
              data-testid="button-use-journal-period"
            >
              Использовать фильтры журнала
            </Button>
            <span className="text-xs text-muted-foreground self-center">
              Отчёт: {reportPeriodLabel} · Журнал: {journalPeriodLabel}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Форма 1-ОСП */}
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Форма 1‑ОСП</h3>
          <p className="text-sm text-muted-foreground">
            Пожары: динамика по месяцам, город/село и потери
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Динамика пожаров по месяцам</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
              <p className="text-sm text-muted-foreground">
                Погибшие: {form1Totals.deaths}, травмированные: {form1Totals.injured}, ущерб:{" "}
                {form1Totals.damage}
              </p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form1Monthly.length === 0 ? (
                <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={form1Monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Line type="monotone" dataKey="count" name="Пожары" stroke="#0088FE" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Город и село</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
              <p className="text-sm text-muted-foreground">Число пожаров и ущерб</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form1Locality.length === 0 ? (
                <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={form1Locality}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Bar dataKey="count" fill="#00C49F" name="Пожары" />
                    <Bar dataKey="damage" fill="#FF8042" name="Ущерб" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Форма 2-ССГ */}
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Форма 2‑ССГ</h3>
          <p className="text-sm text-muted-foreground">
            Происшествия без пожара: причины и регионы
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Причины инцидентов</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form2Causes.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={form2Causes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Bar dataKey="count" fill="#0088FE" name="Инциденты" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Регионы</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form2Regions.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={form2Regions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Bar dataKey="count" fill="#00C49F" name="Инциденты" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Форма 3-СПВП */}
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Форма 3‑СПВП</h3>
          <p className="text-sm text-muted-foreground">Причины пожаров и топ‑10</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Распределение причин</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form3Causes.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={form3Causes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ label, percent }: any) => `${label}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="count"
                    >
                      {form3Causes.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Топ‑10 причин</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form3TopCauses.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={form3TopCauses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Bar dataKey="count" fill="#FF8042" name="Пожары" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Форма 4-СОВП */}
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Форма 4‑СОВП</h3>
          <p className="text-sm text-muted-foreground">
            Распределение объектов и сравнение с прошлым периодом
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Топ объектов пожара</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form4Objects.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={form4Objects}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Bar dataKey="count" fill="#8884d8" name="Пожары" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Сравнение периодов</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
              <p className="text-sm text-muted-foreground">
                Изменение: {form4Comparison.delta}{" "}
                {form4Comparison.percent !== null ? `(${form4Comparison.percent.toFixed(1)}%)` : ""}
              </p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={comparisonChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Bar dataKey="value" fill="#FFBB28" name="Пожары" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Форма 5-СПЖС */}
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Форма 5‑СПЖС</h3>
          <p className="text-sm text-muted-foreground">
            Жилой сектор: город/село и ущерб
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Пожары в жилом секторе</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form5Locality.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={form5Locality}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Bar dataKey="count" fill="#0088FE" name="Пожары" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ущерб (жилой сектор)</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form5Locality.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={form5Locality}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Bar dataKey="damage" fill="#FF8042" name="Ущерб" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Форма 6-ССПЗ */}
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Форма 6‑ССПЗ</h3>
          <p className="text-sm text-muted-foreground">
            Степные пожары: сезонность и регионы
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Сезонность по месяцам</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form6Monthly.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={form6Monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Line type="monotone" dataKey="count" stroke="#00C49F" name="Степные пожары" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Регионы</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form6Regions.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={form6Regions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Bar dataKey="count" fill="#0088FE" name="Случаи" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Форма 7-CO */}
      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Форма 7‑CO</h3>
          <p className="text-sm text-muted-foreground">
            Отравления CO без пожара: потери и регионы
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Погибшие и травмированные</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={form7TotalsChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Bar dataKey="value" fill="#FF8042" name="Люди" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Распределение по регионам</CardTitle>
              <p className="text-xs text-muted-foreground">Период: {periodLabel}</p>
            </CardHeader>
            <CardContent>
              {isAnalyticsLoading ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Загрузка данных...
                </div>
              ) : form7Regions.length === 0 ? (
                <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                  Нет данных за выбранный период
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={form7Regions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" fontSize={11} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={tooltipLabelFormatter} />
                    <Bar dataKey="count" fill="#8884d8" name="Инциденты" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
