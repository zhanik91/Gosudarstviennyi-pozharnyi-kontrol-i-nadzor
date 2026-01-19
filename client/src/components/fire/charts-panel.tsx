import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#2563eb", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#a855f7"];

export default function ChartsPanel() {
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [includeOrgTree, setIncludeOrgTree] = useState(false);
  const [chartsGenerated, setChartsGenerated] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    periodFrom: "",
    periodTo: "",
    includeOrgTree: false,
  });

  const handleBuildCharts = () => {
    setChartsGenerated(true);
    setAppliedFilters({
      periodFrom,
      periodTo,
      includeOrgTree,
    });
  };

  const queryParams = new URLSearchParams();
  if (appliedFilters.periodFrom) {
    queryParams.set("periodFrom", appliedFilters.periodFrom);
  }
  if (appliedFilters.periodTo) {
    queryParams.set("periodTo", appliedFilters.periodTo);
  }
  queryParams.set("includeChildren", appliedFilters.includeOrgTree ? "true" : "false");
  const analyticsUrl = `/api/analytics/forms${queryParams.toString() ? `?${queryParams}` : ""}`;

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: [analyticsUrl],
    enabled: chartsGenerated,
  });

  const monthlyTrends = (analytics as any)?.form1?.monthly ?? [];
  const causes = (analytics as any)?.form2?.causes ?? [];
  const regions = (analytics as any)?.form2?.regions ?? [];

  const periodLabel = `${appliedFilters.periodFrom || "начало"} — ${appliedFilters.periodTo || "настоящее время"}`;

  return (
    <div className="space-y-6">
      
      {/* Chart Controls */}
      <Card className="bg-card border border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Параметры диаграмм</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="periodFrom" className="text-sm font-medium text-foreground mb-2">
                Период с
              </Label>
              <Input
                id="periodFrom"
                type="month"
                placeholder="2025-01"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                data-testid="input-period-from"
              />
            </div>
            
            <div>
              <Label htmlFor="periodTo" className="text-sm font-medium text-foreground mb-2">
                по
              </Label>
              <Input
                id="periodTo"
                type="month"
                placeholder="2025-12"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                data-testid="input-period-to"
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
            
            <div className="flex items-end">
              <Button 
                onClick={handleBuildCharts}
                data-testid="button-build-charts"
              >
                Построить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Trends Chart */}
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Тренды по месяцам</h3>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              {!chartsGenerated ? (
                <p className="text-muted-foreground" data-testid="chart-placeholder-monthly">
                  Нажмите "Построить" для отображения диаграммы
                </p>
              ) : isAnalyticsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"></span>
                  Загрузка данных...
                </div>
              ) : monthlyTrends.length === 0 ? (
                <p className="text-muted-foreground" data-testid="chart-empty-monthly">
                  Нет данных за выбранный период
                </p>
              ) : (
                <div className="w-full h-full" data-testid="chart-monthly-trends">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" name="Инциденты" stroke={COLORS[0]} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            {chartsGenerated && !isAnalyticsLoading && monthlyTrends.length > 0 && (
              <p className="text-sm text-muted-foreground mt-2">Период: {periodLabel}</p>
            )}
          </CardContent>
        </Card>

        {/* Causes Chart */}
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Структура причин</h3>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              {!chartsGenerated ? (
                <p className="text-muted-foreground" data-testid="chart-placeholder-causes">
                  Нажмите "Построить" для отображения диаграммы
                </p>
              ) : isAnalyticsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"></span>
                  Загрузка данных...
                </div>
              ) : causes.length === 0 ? (
                <p className="text-muted-foreground" data-testid="chart-empty-causes">
                  Нет данных по причинам
                </p>
              ) : (
                <div className="w-full h-full" data-testid="chart-causes">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={causes}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={40}
                        outerRadius={90}
                      >
                        {causes.map((entry: { label: string }, index: number) => (
                          <Cell key={`${entry.label}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Regional Distribution */}
        <Card className="bg-card border border-border lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Распределение по регионам</h3>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              {!chartsGenerated ? (
                <p className="text-muted-foreground" data-testid="chart-placeholder-regional">
                  Нажмите "Построить" для отображения диаграммы
                </p>
              ) : isAnalyticsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"></span>
                  Загрузка данных...
                </div>
              ) : regions.length === 0 ? (
                <p className="text-muted-foreground" data-testid="chart-empty-regional">
                  Нет данных по регионам
                </p>
              ) : (
                <div className="w-full h-full" data-testid="chart-regional">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" name="Инциденты" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
