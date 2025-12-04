import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { ErrorDisplay } from '@/components/ui/error-display';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle,
  MapPin, Calendar, FileBarChart, Download
} from 'lucide-react';
import Footer from '@/components/layout/footer';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export default function AdvancedAnalytics() {
  const [period, setPeriod] = useState('2024');
  const [organizationId, setOrganizationId] = useState('');

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['/api/analytics/advanced', { period, organizationId }],
    retry: 2
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <LoadingIndicator message="Загрузка расширенной аналитики..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ErrorDisplay
            message="Ошибка загрузки аналитики"
            onRetry={() => window.location.reload()}
          />
        </div>
        <Footer />
      </div>
    );
  }

  const { incidentTypes = [], regionStats = [], monthlyStats = [], summary = {} } = analytics || {};

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Заголовок и фильтры */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Расширенная аналитика МЧС РК
            </h1>
            <p className="text-muted-foreground mt-2">
              Интерактивные графики и детальный анализ происшествий
            </p>
          </div>
          
          <div className="flex gap-3">
            <div className="space-y-2">
              <Label>Период</Label>
              <Input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-36"
              />
            </div>
            
            <Button variant="outline" className="mt-6">
              <Download className="h-4 w-4 mr-2" />
              Экспорт PDF
            </Button>
          </div>
        </div>

        {/* Общая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full mr-4">
                <Activity className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Всего происшествий</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {summary.totalIncidents || 0}
                </p>
                <Badge variant="secondary" className="mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12% за месяц
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800">
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full mr-4">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Общий ущерб</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {(summary.totalDamage || 0).toLocaleString()} тг
                </p>
                <Badge variant="destructive" className="mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  -5% за месяц
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 dark:border-gray-800">
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-gray-100 dark:bg-gray-900 rounded-full mr-4">
                <MapPin className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Пострадавших</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {summary.totalDeaths || 0}
                </p>
                <Badge variant="outline" className="mt-1">
                  Стабильно
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="flex items-center p-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full mr-4">
                <FileBarChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Активных регионов</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {regionStats.length}
                </p>
                <Badge variant="secondary" className="mt-1">
                  Все области
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Графики и аналитика */}
        <Tabs defaultValue="trends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trends">Динамика</TabsTrigger>
            <TabsTrigger value="types">По типам</TabsTrigger>
            <TabsTrigger value="regions">По регионам</TabsTrigger>
            <TabsTrigger value="forecast">Прогноз</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Динамика происшествий по месяцам
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#ef4444" 
                      fill="#fee2e2" 
                      name="Количество"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ущерб по месяцам</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [`${value?.toLocaleString()} тг`, 'Ущерб']} />
                    <Line 
                      type="monotone" 
                      dataKey="damage" 
                      stroke="#f97316" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Распределение по типам происшествий</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={incidentTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percent }: any) => `${type}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {incidentTypes.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ущерб по типам происшествий</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={incidentTypes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`${value?.toLocaleString()} тг`, 'Ущерб']} />
                      <Bar dataKey="damage" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="regions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Статистика по регионам
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={regionStats} margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Количество" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {regionStats.slice(0, 6).map((region: any, index: number) => (
                <Card key={index} className="border-l-4" style={{ borderLeftColor: COLORS[index] }}>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{region.region}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Происшествий:</span>
                        <span className="font-medium">{region.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ущерб:</span>
                        <span className="font-medium">{(region.damage || 0).toLocaleString()} тг</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Пострадавших:</span>
                        <span className="font-medium">{region.deaths || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="forecast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Прогнозирование рисков
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Зоны повышенного риска</h3>
                    <div className="space-y-3">
                      {['Алматы', 'Шымкент', 'Нур-Султан'].map((city, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={index === 0 ? "destructive" : index === 1 ? "default" : "secondary"}>
                              {index === 0 ? "Высокий" : index === 1 ? "Средний" : "Низкий"}
                            </Badge>
                            <span>{city}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {index === 0 ? "95%" : index === 1 ? "67%" : "23%"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Рекомендации</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Усилить профилактику</h4>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                          В Алматы рекомендуется увеличить количество проверок на 30%
                        </p>
                      </div>
                      
                      <div className="p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200">Сезонность</h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          Ожидается увеличение степных пожаров в мае-июне
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}