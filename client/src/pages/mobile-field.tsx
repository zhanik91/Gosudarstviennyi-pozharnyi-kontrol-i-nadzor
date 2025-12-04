import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Camera, 
  MapPin, 
  Smartphone, 
  Upload, 
  Wifi, 
  WifiOff, 
  Save, 
  Send,
  Clock,
  AlertTriangle,
  CheckCircle,
  Flame,
  Users,
  Home
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/utils/queryClient';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

interface FieldReport {
  id?: string;
  title: string;
  incidentType: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  location: {
    address: string;
    coordinates?: [number, number];
  };
  description: string;
  photos: File[];
  casualties: {
    deaths: number;
    injured: number;
    evacuated: number;
  };
  damage: {
    estimated: number;
    area: number;
    structures: string[];
  };
  response: {
    unitsDispatched: number;
    arrivalTime?: string;
    controlTime?: string;
    extinguishedTime?: string;
  };
  weather: {
    temperature?: number;
    windSpeed?: number;
    humidity?: number;
    conditions: string;
  };
  status: 'draft' | 'submitted' | 'syncing' | 'synced';
  reportedBy: string;
  reportedAt: Date;
  offlineMode: boolean;
}

const INCIDENT_TYPES = [
  'Пожар в жилом доме',
  'Пожар в общественном здании', 
  'Пожар на промышленном объекте',
  'Лесной пожар',
  'Пожар на транспорте',
  'Пожар на открытой территории',
  'ДТП с возгоранием',
  'Взрыв',
  'Утечка опасных веществ',
  'Другое'
];

const SEVERITY_COLORS = {
  minor: 'bg-green-100 text-green-800',
  moderate: 'bg-yellow-100 text-yellow-800', 
  major: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const SEVERITY_LABELS = {
  minor: 'Незначительный',
  moderate: 'Умеренный',
  major: 'Серьезный', 
  critical: 'Критический'
};

export default function MobileField() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fieldReport, setFieldReport] = useState<FieldReport>({
    title: '',
    incidentType: '',
    severity: 'moderate',
    location: { address: '' },
    description: '',
    photos: [],
    casualties: { deaths: 0, injured: 0, evacuated: 0 },
    damage: { estimated: 0, area: 0, structures: [] },
    response: { unitsDispatched: 1 },
    weather: { conditions: 'Ясно' },
    status: 'draft',
    reportedBy: user?.username || '',
    reportedAt: new Date(),
    offlineMode: !isOnline
  });

  // Слушаем изменения статуса сети
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Отправка отчета
  const submitReportMutation = useMutation({
    mutationFn: async (report: FieldReport) => {
      const formData = new FormData();
      
      // Добавляем данные отчета
      formData.append('reportData', JSON.stringify({
        ...report,
        photos: undefined // Фото отправляем отдельно
      }));
      
      // Добавляем фото
      report.photos.forEach((photo, index) => {
        formData.append(`photo_${index}`, photo);
      });
      
      const response = await fetch('/api/field-reports', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Ошибка отправки отчета');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      // Сбрасываем форму
      setFieldReport(prev => ({
        ...prev,
        title: '',
        incidentType: '',
        description: '',
        photos: [],
        casualties: { deaths: 0, injured: 0, evacuated: 0 },
        damage: { estimated: 0, area: 0, structures: [] },
        status: 'draft'
      }));
    }
  });

  // Сохранение в локальном хранилище (для оффлайн режима)
  const saveToLocalStorage = () => {
    const savedReports = JSON.parse(localStorage.getItem('field_reports') || '[]');
    const reportWithId = {
      ...fieldReport,
      id: fieldReport.id || `field_${Date.now()}`,
      status: 'draft' as const,
      savedAt: new Date().toISOString()
    };
    
    const updatedReports = savedReports.filter((r: any) => r.id !== reportWithId.id);
    updatedReports.push(reportWithId);
    
    localStorage.setItem('field_reports', JSON.stringify(updatedReports));
    setFieldReport(prev => ({ ...prev, id: reportWithId.id, status: 'draft' }));
  };

  // Получение текущего местоположения
  const getCurrentLocation = () => {
    setIsLocationLoading(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
          setCurrentLocation(coords);
          setFieldReport(prev => ({
            ...prev,
            location: { ...prev.location, coordinates: coords }
          }));
          setIsLocationLoading(false);
        },
        (error) => {
          console.error('Ошибка получения местоположения:', error);
          setIsLocationLoading(false);
        }
      );
    } else {
      alert('Геолокация не поддерживается браузером');
      setIsLocationLoading(false);
    }
  };

  // Обработка фото
  const handlePhotoCapture = (files: FileList | null) => {
    if (files && files.length > 0) {
      const newPhotos = Array.from(files);
      setFieldReport(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos].slice(0, 10) // Максимум 10 фото
      }));
    }
  };

  const removePhoto = (index: number) => {
    setFieldReport(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    if (!fieldReport.title || !fieldReport.incidentType || !fieldReport.description) {
      alert('Заполните обязательные поля');
      return;
    }

    if (isOnline) {
      submitReportMutation.mutate(fieldReport);
    } else {
      saveToLocalStorage();
      alert('Отчет сохранен локально. Будет отправлен при подключении к сети.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
      {/* Статус подключения */}
      <Card className={`${isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'} dark:bg-gray-900`}>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
              <span className={`font-medium ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
                {isOnline ? 'Онлайн режим' : 'Оффлайн режим'}
              </span>
            </div>
            <Badge variant={isOnline ? 'default' : 'destructive'} data-testid="connection-status">
              {isOnline ? 'Подключено' : 'Нет сети'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Smartphone className="w-8 h-8" />
          Полевой отчет
        </h1>
        <p className="text-gray-600 dark:text-gray-400">Создание отчета о происшествии с места события</p>
      </div>

      {/* Основная информация */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5" />
            Основная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Краткое описание происшествия *</Label>
            <Input
              id="title"
              value={fieldReport.title}
              onChange={(e) => setFieldReport(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Например: Пожар в жилом доме"
              data-testid="input-report-title"
            />
          </div>
          
          <div>
            <Label htmlFor="incident-type">Тип происшествия *</Label>
            <Select 
              value={fieldReport.incidentType} 
              onValueChange={(value) => setFieldReport(prev => ({ ...prev, incidentType: value }))}
            >
              <SelectTrigger data-testid="select-incident-type">
                <SelectValue placeholder="Выберите тип происшествия" />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="severity">Степень тяжести</Label>
            <Select 
              value={fieldReport.severity} 
              onValueChange={(value: any) => setFieldReport(prev => ({ ...prev, severity: value }))}
            >
              <SelectTrigger data-testid="select-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description">Подробное описание *</Label>
            <Textarea
              id="description"
              value={fieldReport.description}
              onChange={(e) => setFieldReport(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Опишите детали происшествия, принятые меры..."
              rows={4}
              data-testid="textarea-description"
            />
          </div>
        </CardContent>
      </Card>

      {/* Местоположение */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Местоположение
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Адрес происшествия</Label>
            <Input
              id="address"
              value={fieldReport.location.address}
              onChange={(e) => setFieldReport(prev => ({
                ...prev,
                location: { ...prev.location, address: e.target.value }
              }))}
              placeholder="Укажите точный адрес"
              data-testid="input-address"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>GPS координаты</Label>
              {currentLocation ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentLocation[0].toFixed(6)}, {currentLocation[1].toFixed(6)}
                </p>
              ) : (
                <p className="text-sm text-gray-500">Не определены</p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isLocationLoading}
              data-testid="button-get-location"
            >
              {isLocationLoading ? <LoadingIndicator /> : <MapPin className="w-4 h-4 mr-2" />}
              {isLocationLoading ? 'Получение...' : 'Определить'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Фотодокументация */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Фотографии ({fieldReport.photos.length}/10)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              capture="environment"
              onChange={(e) => handlePhotoCapture(e.target.files)}
              className="hidden"
              data-testid="input-photos"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={fieldReport.photos.length >= 10}
              className="w-full"
              data-testid="button-add-photo"
            >
              <Camera className="w-4 h-4 mr-2" />
              {fieldReport.photos.length === 0 ? 'Добавить фото' : `Добавить еще (${10 - fieldReport.photos.length} осталось)`}
            </Button>
          </div>
          
          {fieldReport.photos.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {fieldReport.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Фото ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                    data-testid={`photo-${index}`}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 w-6 h-6 p-0"
                    onClick={() => removePhoto(index)}
                    data-testid={`button-remove-photo-${index}`}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Потери и ущерб */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Потери и ущерб
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="deaths">Погибшие</Label>
              <Input
                id="deaths"
                type="number"
                min="0"
                value={fieldReport.casualties.deaths}
                onChange={(e) => setFieldReport(prev => ({
                  ...prev,
                  casualties: { ...prev.casualties, deaths: parseInt(e.target.value) || 0 }
                }))}
                data-testid="input-deaths"
              />
            </div>
            <div>
              <Label htmlFor="injured">Пострадавшие</Label>
              <Input
                id="injured"
                type="number"
                min="0"
                value={fieldReport.casualties.injured}
                onChange={(e) => setFieldReport(prev => ({
                  ...prev,
                  casualties: { ...prev.casualties, injured: parseInt(e.target.value) || 0 }
                }))}
                data-testid="input-injured"
              />
            </div>
            <div>
              <Label htmlFor="evacuated">Эвакуированные</Label>
              <Input
                id="evacuated"
                type="number"
                min="0"
                value={fieldReport.casualties.evacuated}
                onChange={(e) => setFieldReport(prev => ({
                  ...prev,
                  casualties: { ...prev.casualties, evacuated: parseInt(e.target.value) || 0 }
                }))}
                data-testid="input-evacuated"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimated-damage">Примерный ущерб (₸)</Label>
              <Input
                id="estimated-damage"
                type="number"
                min="0"
                value={fieldReport.damage.estimated}
                onChange={(e) => setFieldReport(prev => ({
                  ...prev,
                  damage: { ...prev.damage, estimated: parseInt(e.target.value) || 0 }
                }))}
                data-testid="input-damage"
              />
            </div>
            <div>
              <Label htmlFor="damaged-area">Площадь поражения (м²)</Label>
              <Input
                id="damaged-area"
                type="number"
                min="0"
                value={fieldReport.damage.area}
                onChange={(e) => setFieldReport(prev => ({
                  ...prev,
                  damage: { ...prev.damage, area: parseInt(e.target.value) || 0 }
                }))}
                data-testid="input-area"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Действия */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={saveToLocalStorage}
          className="flex-1"
          data-testid="button-save-draft"
        >
          <Save className="w-4 h-4 mr-2" />
          Сохранить
        </Button>
        
        <Button
          onClick={handleSubmit}
          disabled={submitReportMutation.isPending}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          data-testid="button-submit-report"
        >
          {submitReportMutation.isPending ? (
            <LoadingIndicator />
          ) : (
            <>
              {isOnline ? <Send className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {isOnline ? 'Отправить' : 'Сохранить локально'}
            </>
          )}
        </Button>
      </div>
      
      {/* Статус отчета */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Статус отчета:</span>
            <Badge className={SEVERITY_COLORS[fieldReport.status === 'draft' ? 'minor' : 'moderate']} data-testid="report-status">
              {fieldReport.status === 'draft' ? 'Черновик' : fieldReport.status}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}