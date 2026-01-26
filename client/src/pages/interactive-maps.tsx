import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Map, Filter, TrendingUp, AlertTriangle, Flame, Users, Home, DollarSign, Plus, MapPin, Building, Search } from 'lucide-react';
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

interface ControlObjectForm {
  name: string;
  category: string;
  address: string;
  region: string;
  district: string;
  latitude: string;
  longitude: string;
  riskLevel: string;
  description: string;
  contactPerson: string;
  contactPhone: string;
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

const OBJECT_CATEGORIES = [
  { value: 'residential', label: 'Жилые здания' },
  { value: 'commercial', label: 'Коммерческие объекты' },
  { value: 'industrial', label: 'Промышленные объекты' },
  { value: 'educational', label: 'Образовательные учреждения' },
  { value: 'medical', label: 'Медицинские учреждения' },
  { value: 'cultural', label: 'Культурные объекты' },
  { value: 'transport', label: 'Транспортные объекты' },
  { value: 'other', label: 'Прочие' },
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
  const [showAddObjectDialog, setShowAddObjectDialog] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const [objectForm, setObjectForm] = useState<ControlObjectForm>({
    name: '',
    category: 'residential',
    address: '',
    region: '',
    district: '',
    latitude: '',
    longitude: '',
    riskLevel: 'medium',
    description: '',
    contactPerson: '',
    contactPhone: '',
  });

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

  const createObjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/control-objects', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/control-objects'] });
      setShowAddObjectDialog(false);
      resetForm();
      toast({
        title: 'Объект добавлен',
        description: 'Объект контроля успешно создан',
      });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать объект',
        variant: 'destructive',
      });
    }
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

  const resetForm = () => {
    setObjectForm({
      name: '',
      category: 'residential',
      address: '',
      region: '',
      district: '',
      latitude: '',
      longitude: '',
      riskLevel: 'medium',
      description: '',
      contactPerson: '',
      contactPhone: '',
    });
    setSearchAddress('');
  };

  const handleGeocodeAddress = async () => {
    if (!searchAddress.trim()) return;
    
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress + ', Kazakhstan')}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setObjectForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          address: display_name,
        }));
        toast({
          title: 'Адрес найден',
          description: `Координаты: ${parseFloat(lat).toFixed(6)}, ${parseFloat(lon).toFixed(6)}`,
        });
      } else {
        toast({
          title: 'Адрес не найден',
          description: 'Попробуйте уточнить адрес',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка поиска',
        description: 'Не удалось найти адрес',
        variant: 'destructive',
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setObjectForm(prev => ({
      ...prev,
      latitude: lat.toFixed(7),
      longitude: lng.toFixed(7),
    }));
    setShowAddObjectDialog(true);
  };

  const handleAddMarker = (data: Partial<MarkerData>) => {
    if (data.type === 'object' && data.latitude && data.longitude) {
      setObjectForm(prev => ({
        ...prev,
        latitude: data.latitude!.toFixed(7),
        longitude: data.longitude!.toFixed(7),
      }));
      setShowAddObjectDialog(true);
    }
  };

  const handleDeleteMarker = (id: string, type: 'incident' | 'object') => {
    if (type === 'object') {
      deleteObjectMutation.mutate(id);
    }
  };

  const handleSubmitObject = () => {
    if (!objectForm.name || !objectForm.address || !objectForm.latitude || !objectForm.longitude) {
      toast({
        title: 'Заполните обязательные поля',
        description: 'Название, адрес и координаты обязательны',
        variant: 'destructive',
      });
      return;
    }

    createObjectMutation.mutate({
      name: objectForm.name,
      category: objectForm.category,
      address: objectForm.address,
      region: objectForm.region || selectedRegion,
      district: objectForm.district,
      latitude: objectForm.latitude,
      longitude: objectForm.longitude,
      riskLevel: objectForm.riskLevel,
      description: objectForm.description,
      contactPerson: objectForm.contactPerson,
      contactPhone: objectForm.contactPhone,
    });
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
        
        <Dialog open={showAddObjectDialog} onOpenChange={setShowAddObjectDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Добавить объект
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Добавить объект контроля</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Определение координат
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label>Поиск по адресу</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Введите адрес для геокодирования..."
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGeocodeAddress()}
                      />
                      <Button onClick={handleGeocodeAddress} disabled={isGeocoding}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Или кликните на карту для выбора точки
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Широта</Label>
                      <Input
                        placeholder="48.0196"
                        value={objectForm.latitude}
                        onChange={(e) => setObjectForm(prev => ({ ...prev, latitude: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Долгота</Label>
                      <Input
                        placeholder="66.9237"
                        value={objectForm.longitude}
                        onChange={(e) => setObjectForm(prev => ({ ...prev, longitude: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Название объекта *</Label>
                  <Input
                    placeholder="ТРЦ Мега Алматы"
                    value={objectForm.name}
                    onChange={(e) => setObjectForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>Категория</Label>
                  <Select 
                    value={objectForm.category} 
                    onValueChange={(v) => setObjectForm(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OBJECT_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Уровень риска</Label>
                  <Select 
                    value={objectForm.riskLevel} 
                    onValueChange={(v) => setObjectForm(prev => ({ ...prev, riskLevel: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="critical">Критический</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <Label>Адрес *</Label>
                  <Input
                    placeholder="Полный адрес объекта"
                    value={objectForm.address}
                    onChange={(e) => setObjectForm(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>Регион</Label>
                  <Select 
                    value={objectForm.region} 
                    onValueChange={(v) => setObjectForm(prev => ({ ...prev, region: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите регион" />
                    </SelectTrigger>
                    <SelectContent>
                      {KAZAKHSTAN_REGIONS.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Район</Label>
                  <Input
                    placeholder="Район"
                    value={objectForm.district}
                    onChange={(e) => setObjectForm(prev => ({ ...prev, district: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>Контактное лицо</Label>
                  <Input
                    placeholder="ФИО ответственного"
                    value={objectForm.contactPerson}
                    onChange={(e) => setObjectForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>Телефон</Label>
                  <Input
                    placeholder="+7 (XXX) XXX-XX-XX"
                    value={objectForm.contactPhone}
                    onChange={(e) => setObjectForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Описание</Label>
                  <Input
                    placeholder="Дополнительная информация об объекте"
                    value={objectForm.description}
                    onChange={(e) => setObjectForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddObjectDialog(false); resetForm(); }}>
                Отмена
              </Button>
              <Button onClick={handleSubmitObject} disabled={createObjectMutation.isPending}>
                {createObjectMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                  editable={true}
                  onMapClick={handleMapClick}
                  onAddMarker={handleAddMarker}
                  onDeleteMarker={handleDeleteMarker}
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
