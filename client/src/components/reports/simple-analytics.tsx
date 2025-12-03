import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Cell
} from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Users } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function SimpleAnalytics() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats/dashboard"],
  });

  const { data: monthlyData } = useQuery({
    queryKey: ["/api/analytics/monthly"],
    enabled: false, // Загружаем по запросу
  });

  const currentMonth = new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

  // Данные для графиков (примерные данные на основе статистики)
  const regionData = [
    { name: 'Алматы', incidents: 15, deaths: 2 },
    { name: 'Астана', incidents: 12, deaths: 1 },
    { name: 'Шымкент', incidents: 8, deaths: 0 },
    { name: 'Караганда', incidents: 6, deaths: 1 },
    { name: 'Актобе', incidents: 4, deaths: 0 },
  ];

  const typeData = [
    { name: 'Пожары в жилых домах', value: 45, color: '#FF8042' },
    { name: 'Пожары на производстве', value: 25, color: '#0088FE' },
    { name: 'Степные пожары', value: 20, color: '#00C49F' },
    { name: 'Прочие', value: 10, color: '#FFBB28' },
  ];

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Простая аналитика</h2>
        <p className="text-muted-foreground">Обзор пожарной обстановки по регионам РК</p>
      </div>

      {/* Ключевые показатели */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего пожаров</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats as any)?.incidents || 0}</div>
            <p className="text-xs text-muted-foreground">за {currentMonth}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Материальный ущерб</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245.6</div>
            <p className="text-xs text-muted-foreground">млн. тенге</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Погибших</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">человек</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Спасено людей</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">человек</p>
          </CardContent>
        </Card>
      </div>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График по регионам */}
        <Card>
          <CardHeader>
            <CardTitle>Пожары по регионам</CardTitle>
            <p className="text-sm text-muted-foreground">Топ-5 регионов с наибольшим количеством пожаров</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={regionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="incidents" fill="#0088FE" name="Пожары" />
                <Bar dataKey="deaths" fill="#FF8042" name="Погибшие" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Круговая диаграмма по типам */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение по типам</CardTitle>
            <p className="text-sm text-muted-foreground">Структура пожаров по объектам возгорания</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Тренды */}
      <Card>
        <CardHeader>
          <CardTitle>Сравнение с прошлым периодом</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Количество пожаров</p>
                <p className="text-2xl font-bold">-12%</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Снижение
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Материальный ущерб</p>
                <p className="text-2xl font-bold">+8%</p>
              </div>
              <Badge variant="outline" className="text-red-600 border-red-600">
                Рост
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Количество жертв</p>
                <p className="text-2xl font-bold">-25%</p>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Снижение
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}