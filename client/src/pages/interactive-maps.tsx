import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Map, Filter, TrendingUp, AlertTriangle, Flame, Users, Home, DollarSign, MapPin, Building, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { LeafletMap } from '@/components/maps/leaflet-map';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface MarkerData {
  id: string;
  type: 'incident' | 'object';
  latitude: number;
  longitude: number;
  title: string;
  details: Record<string, any>;
}

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
  incidents: MarkerData[];
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
  'Ұлытау облысы',
  'Жетісу облысы',
  'Абай облысы',
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const userRole = (user as any)?.role;
  const isMchsUser = userRole === "MCHS" || userRole === "admin";
  const userRegion = (user as any)?.region || "";
  
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('month');
  const [activeTab, setActiveTab] = useState<string>('map');
  const [showIncidents, setShowIncidents] = useState(true);
  const [showObjects, setShowObjects] = useState(true);

  useEffect(() => {
    if (!userRegion || isMchsUser) return;
    setSelectedRegion(userRegion);
  }, [isMchsUser, userRegion]);

  const availableRegions = useMemo(() => {
    if (isMchsUser || !userRegion) return KAZAKHSTAN_REGIONS;
    return [userRegion];
  }, [isMchsUser, userRegion]);

  const { data: allIncidents = [] } = useQuery<any[]>({
    queryKey: ['/api/incidents'],
    queryFn: async () => {
      const response = await fetch('/api/incidents');
      if (!response.ok) throw new Error('Ошибка загрузки списка инцидентов');
      return response.json();
    }
  });

  const updateCoordsMutation = useMutation({
    mutationFn: async ({ type, id, lat, lng }: { type: 'incident' | 'object', id: string, lat: number, lng: number }) => {
      const endpoint = type === 'incident' ? `/api/incidents/${id}` : `/api/control-objects/${id}`;
      const response = await apiRequest('PATCH', endpoint, {
        latitude: lat.toString(),
        longitude: lng.toString()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maps/data'] });
      queryClient.invalidateQueries({ queryKey: ['/api/control-objects'] });
      toast({
        title: 'Координаты обновлены',
        description: 'Новое местоположение успешно сохранено',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить координаты',
        variant: 'destructive'
      });
    }
  });

  const handleSelectExisting = (type: 'incident' | 'object', id: string, lat: number, lng: number) => {
    updateCoordsMutation.mutate({ type, id, lat, lng });
  };

  const handleRegionSelect = (region: string) => {
    if (!isMchsUser && userRegion) {
      setSelectedRegion(userRegion);
      return;
    }
    setSelectedRegion(region);
  };

  const { data: mapData, isLoading } = useQuery<MapData>({
    queryKey: ['/api/maps/data', { region: selectedRegion, timeRange }],
    queryFn: async () => {
      const params = new URLSearchParams({
        region: selectedRegion,
        timeRange,
      });
      const response = await fetch(`/api/maps/data?${params}`);
      if (!response.ok) throw new Error('Ошибка загрузки карты');
      return response.json();
    }
  });

  const { data: controlObjects = [] } = useQuery<MarkerData[]>({
    queryKey: ['/api/control-objects', { region: selectedRegion }],
    queryFn: async () => {
      const params = new URLSearchParams({
        region: selectedRegion,
      });
      const response = await fetch(`/api/control-objects?${params}`);
      if (!response.ok) throw new Error('Ошибка загрузки объектов');
      return response.json();
    }
  });

  const { data: forecasts = [] } = useQuery<Forecast[]>({
    queryKey: ['/api/forecasts'],
  });

  const deleteObjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/control-objects/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/control-objects'] });
      toast({
        title: 'Объект удален',
        description: 'Объект контроля успешно удален',
      });
    },
  });

  const handleDeleteMarker = (id: string, type: 'incident' | 'object') => {
    if (type === 'object') {
      deleteObjectMutation.mutate(id);
    }
  };

  if (isLoading) return <LoadingIndicator />;

  const incidentMarkers = mapData?.incidents || [];
  const objectMarkers = controlObjects.filter(o => o.latitude && o.longitude);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Интерактивные карты</h1>
          <p className="text-gray-600 dark:text-gray-400">Геоинформационная система анализа пожарной безопасности</p>
        </div>
        
        <Link href="/control-supervision?tab=registry">
          <Button variant="outline">
            <Building className="w-4 h-4 mr-2" />
            Управление объектами
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        </Link>
      </div>

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
              <Label className="block text-sm font-medium mb-1">Регион</Label>
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
              <Label className="block text-sm font-medium mb-1">Период</Label>
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
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-incidents"
                  checked={showIncidents}
                  onCheckedChange={setShowIncidents}
                />
                <Label htmlFor="show-incidents" className="flex items-center gap-1 cursor-pointer">
                  <Flame className="w-4 h-4 text-red-500" />
                  Происшествия
                </Label>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-objects"
                  checked={showObjects}
                  onCheckedChange={setShowObjects}
                />
                <Label htmlFor="show-objects" className="flex items-center gap-1 cursor-pointer">
                  <Building className="w-4 h-4 text-blue-500" />
                  Объекты контроля
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="map">
            <Map className="w-4 h-4 mr-2" />
            Карта
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="w-4 h-4 mr-2" />
            Статистика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="h-[600px] rounded-lg overflow-hidden">
                <LeafletMap
                  incidents={incidentMarkers}
                  objects={objectMarkers}
                  showIncidents={showIncidents}
                  showObjects={showObjects}
                  selectedRegion={selectedRegion}
                  editable={false}
                  onDeleteMarker={handleDeleteMarker}
                  onSelectExisting={handleSelectExisting}
                  allIncidents={allIncidents}
                  allObjects={controlObjects}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        {incidentMarkers.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Происшествий на карте</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <Building className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-2xl font-bold text-green-600" data-testid="metric-total-objects">
                        {objectMarkers.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Объектов контроля</div>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <AlertTriangle className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="text-2xl font-bold text-yellow-600">
                        {objectMarkers.filter(o => o.details.riskLevel === 'high' || o.details.riskLevel === 'critical').length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Объектов высокого риска</div>
                    </div>
                    
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <MapPin className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {KAZAKHSTAN_REGIONS.length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Регионов охвачено</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Прогнозы рисков
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forecasts.length > 0 ? (
                    forecasts.slice(0, 4).map((forecast, index) => (
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
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Прогнозы будут доступны после накопления достаточного объема данных</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
