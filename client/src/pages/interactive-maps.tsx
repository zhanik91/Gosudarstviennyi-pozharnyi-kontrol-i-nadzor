import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Map, Filter, TrendingUp, AlertTriangle, Flame, Users, Home, DollarSign } from 'lucide-react';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useAuth } from '@/hooks/useAuth';

interface MapData {
  regions: {
    name: string;
    incidents: number;
    deaths: number;
    damage: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    coordinates: [number, number];
    population: number;
    objects: number;
  }[];
  incidents: {
    id: string;
    coordinates: [number, number];
    type: string;
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    dateTime: string;
    address: string;
    damage?: number;
    casualties?: number;
  }[];
  heatmapData: {
    coordinates: [number, number];
    intensity: number;
  }[];
  trends: {
    period: string;
    incidents: number;
    prediction: number;
  }[];
}

interface Forecast {
  region: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendation: string;
  probability: number;
}

const KAZAKHSTAN_REGIONS = [
  'Алматинская область',
  'Акмолинская область', 
  'Актюбинская область',
  'Атырауская область',
  'Восточно-Казахстанская область',
  'Жамбылская область',
  'Западно-Казахстанская область',
  'Карагандинская область',
  'Костанайская область',
  'Кызылординская область',
  'Мангистауская область',
  'Павлодарская область',
  'Северо-Казахстанская область',
  'Туркестанская область',
  'Алматы',
  'Астана',
  'Шымкент'
];

const RISK_COLORS = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500', 
  high: 'bg-orange-500',
  critical: 'bg-red-500'
};

const RISK_LABELS = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий', 
  critical: 'Критический'
};

export default function InteractiveMaps() {
  const { user } = useAuth();
  const userRole = (user as any)?.role;
  const isMchsUser = userRole === "MCHS" || userRole === "admin";
  const userRegion = (user as any)?.region || "";
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('month');
  const [mapView, setMapView] = useState<'incidents' | 'heatmap' | 'risk'>('incidents');
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    if (!userRegion || isMchsUser) return;
    setSelectedRegion(userRegion);
  }, [isMchsUser, userRegion]);

  const availableRegions = useMemo(() => {
    if (isMchsUser || !userRegion) return KAZAKHSTAN_REGIONS;
    return [userRegion];
  }, [isMchsUser, userRegion]);

  const handleRegionSelect = (region: string) => {
    if (!isMchsUser && userRegion) {
      setSelectedRegion(userRegion);
      return;
    }
    setSelectedRegion(region);
  };

  // Получение данных для карты
  const { data: mapData, isLoading } = useQuery<MapData>({
    queryKey: ['/api/maps/data', { region: selectedRegion, timeRange, view: mapView }],
    queryFn: async () => {
      const params = new URLSearchParams({
        region: selectedRegion,
        timeRange,
        view: mapView
      });
      const response = await fetch(`/api/maps/data?${params}`);
      if (!response.ok) throw new Error('Ошибка загрузки карты');
      return response.json();
    }
  });

  // Получение прогнозов
  const { data: forecasts = [] } = useQuery<Forecast[]>({
    queryKey: ['/api/forecasts'],
    queryFn: async () => {
      const response = await fetch('/api/forecasts');
      if (!response.ok) throw new Error('Ошибка загрузки прогнозов');
      return response.json();
    }
  });

  // Имитация SVG карты Казахстана (упрощенная)
  const KazakhstanMap = ({ data }: { data: MapData }) => (
    <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[500px] flex items-center justify-center">
      <div className="text-center space-y-4">
        <Map className="w-16 h-16 mx-auto text-gray-400" />
        <div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Интерактивная карта Казахстана</h3>
          <p className="text-gray-500 dark:text-gray-400">Визуализация происшествий по регионам</p>
        </div>
        
        {/* Статистика по регионам */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {data.regions.slice(0, 8).map((region) => (
            <div 
              key={region.name}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${RISK_COLORS[region.riskLevel]} bg-opacity-20 hover:bg-opacity-30`}
              onClick={() => handleRegionSelect(region.name)}
              data-testid={`region-${region.name.replace(/\s+/g, '-').toLowerCase()}`}
            >
              <div className="text-center">
                <div className="font-semibold text-sm mb-1">{region.name.replace(' область', '')}</div>
                <div className="text-xs space-y-1">
                  <div>Происшествий: {region.incidents}</div>
                  <div>Риск: <Badge className={`${RISK_COLORS[region.riskLevel]} text-white text-xs`}>
                    {RISK_LABELS[region.riskLevel]}
                  </Badge></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Легенда */}
        {showLegend && (
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border">
            <h4 className="font-semibold mb-2">Легенда</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(RISK_LABELS).map(([level, label]) => (
                <div key={level} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${RISK_COLORS[level as keyof typeof RISK_COLORS]}`} />
                  <span>{label} риск</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) return <LoadingIndicator />;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Заголовок */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Интерактивные карты</h1>
          <p className="text-gray-600 dark:text-gray-400">Геоинформационная система анализа пожарной безопасности</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={showLegend ? "default" : "outline"}
            onClick={() => setShowLegend(!showLegend)}
            data-testid="button-toggle-legend"
          >
            Легенда
          </Button>
        </div>
      </div>

      {/* Панель управления */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Настройки карты
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Регион</label>
              <Select value={selectedRegion} onValueChange={handleRegionSelect}>
                <SelectTrigger data-testid="select-region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isMchsUser && <SelectItem value="all">Все регионы</SelectItem>}
                  {availableRegions.map(region => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Период</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger data-testid="select-time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Неделя</SelectItem>
                  <SelectItem value="month">Месяц</SelectItem>
                  <SelectItem value="quarter">Квартал</SelectItem>
                  <SelectItem value="year">Год</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Режим просмотра</label>
              <Select value={mapView} onValueChange={(value: any) => setMapView(value)}>
                <SelectTrigger data-testid="select-map-view">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incidents">Происшествия</SelectItem>
                  <SelectItem value="heatmap">Тепловая карта</SelectItem>
                  <SelectItem value="risk">Карта рисков</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                className="w-full"
                data-testid="button-export-map"
              >
                Экспорт карты
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Основная карта */}
      <Card>
        <CardContent className="p-6">
          {mapData ? (
            <KazakhstanMap data={mapData} />
          ) : (
            <div className="min-h-[500px] flex items-center justify-center">
              <LoadingIndicator />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Статистика и прогнозы */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ключевые метрики */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Ключевые показатели
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mapData && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Flame className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600" data-testid="metric-total-incidents">
                    {mapData.regions.reduce((sum, r) => sum + r.incidents, 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Всего происшествий</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600" data-testid="metric-total-deaths">
                    {mapData.regions.reduce((sum, r) => sum + r.deaths, 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Общие потери</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Home className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-600" data-testid="metric-total-objects">
                    {mapData.regions.reduce((sum, r) => sum + r.objects, 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Объектов контроля</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600" data-testid="metric-total-damage">
                    {(mapData.regions.reduce((sum, r) => sum + r.damage, 0) / 1000000).toFixed(1)}М₸
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Общий ущерб</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Прогнозы рисков */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Прогнозы рисков
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {forecasts.slice(0, 4).map((forecast, index) => (
                <div 
                  key={index} 
                  className="p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  data-testid={`forecast-${index}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{forecast.region}</div>
                    <Badge className={`${RISK_COLORS[forecast.riskLevel]} text-white`}>
                      {RISK_LABELS[forecast.riskLevel]}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <div>Вероятность: {forecast.probability}%</div>
                    <div>Факторы риска: {forecast.factors.join(', ')}</div>
                  </div>
                  
                  <div className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <strong>Рекомендация:</strong> {forecast.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Трендовый анализ */}
      {mapData && mapData.trends && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Тренды и прогнозирование
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-4">Динамика происшествий</h4>
                <div className="space-y-2">
                  {mapData.trends.map((trend, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded" data-testid={`trend-${index}`}>
                      <span className="text-sm">{trend.period}</span>
                      <div className="flex gap-4">
                        <span className="text-sm">Факт: {trend.incidents}</span>
                        <span className="text-sm text-blue-600">Прогноз: {trend.prediction}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-4">Рекомендации</h4>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded">
                    Усилить профилактическую работу в регионах повышенного риска
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded">
                    Провести дополнительные проверки объектов с массовым пребыванием людей
                  </div>
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 rounded">
                    Организовать обучающие мероприятия для населения
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
