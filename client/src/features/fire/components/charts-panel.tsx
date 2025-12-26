import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function ChartsPanel() {
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [includeOrgTree, setIncludeOrgTree] = useState(false);
  const [chartsGenerated, setChartsGenerated] = useState(false);

  const handleBuildCharts = () => {
    setChartsGenerated(true);
  };

  // Simulate chart rendering
  useEffect(() => {
    if (chartsGenerated) {
      // In a real app, you would use Chart.js or recharts here
      // For now, we'll just simulate chart containers
    }
  }, [chartsGenerated]);

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
                type="text"
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
                type="text"
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
              {chartsGenerated ? (
                <div className="text-center" data-testid="chart-monthly-trends">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-8 h-8 bg-primary rounded"></div>
                  </div>
                  <p className="text-muted-foreground">График трендов по месяцам</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Данные за период {periodFrom || "2025-01"} — {periodTo || "2025-12"}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground" data-testid="chart-placeholder-monthly">
                  Нажмите "Построить" для отображения диаграммы
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Causes Chart */}
        <Card className="bg-card border border-border">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Структура причин</h3>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              {chartsGenerated ? (
                <div className="text-center" data-testid="chart-causes">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <div className="w-8 h-8 bg-accent rounded-full"></div>
                  </div>
                  <p className="text-muted-foreground">Структура причин пожаров</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Круговая диаграмма распределения
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground" data-testid="chart-placeholder-causes">
                  Нажмите "Построить" для отображения диаграммы
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Regional Distribution */}
        <Card className="bg-card border border-border lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Распределение по регионам</h3>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              {chartsGenerated ? (
                <div className="text-center" data-testid="chart-regional">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-8 bg-primary rounded" style={{ height: `${20 + i * 10}px` }}></div>
                    ))}
                  </div>
                  <p className="text-muted-foreground">Распределение инцидентов по регионам</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Столбчатая диаграмма по областям РК
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground" data-testid="chart-placeholder-regional">
                  Нажмите "Построить" для отображения диаграммы
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
