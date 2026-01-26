import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MapPin, Search, Plus, Trash2, Edit2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

interface MarkerData {
  id: string;
  type: 'incident' | 'object';
  latitude: number;
  longitude: number;
  title: string;
  details: Record<string, any>;
}

interface LeafletMapProps {
  incidents?: MarkerData[];
  objects?: MarkerData[];
  onMarkerClick?: (marker: MarkerData) => void;
  onMapClick?: (lat: number, lng: number) => void;
  onAddMarker?: (data: Partial<MarkerData>) => void;
  onDeleteMarker?: (id: string, type: 'incident' | 'object') => void;
  onSelectExisting?: (type: 'incident' | 'object', id: string, lat: number, lng: number) => void;
  showIncidents?: boolean;
  showObjects?: boolean;
  selectedRegion?: string;
  editable?: boolean;
  allIncidents?: any[];
  allObjects?: any[];
}

const KAZAKHSTAN_CENTER: [number, number] = [48.0196, 66.9237];
const KAZAKHSTAN_BOUNDS: [[number, number], [number, number]] = [[40.5, 46.5], [55.5, 87.5]];

const REGION_CENTERS: Record<string, [number, number]> = {
  'Акмолинская область': [51.9167, 69.4167],
  'Актюбинская область': [50.2833, 57.1667],
  'Алматинская область': [44.85, 77.0833],
  'Атырауская область': [47.1, 51.9167],
  'Восточно-Казахстанская область': [49.9667, 82.6167],
  'Жамбылская область': [43.3567, 70.8833],
  'Западно-Казахстанская область': [51.2333, 51.3667],
  'Карагандинская область': [49.8333, 73.1667],
  'Костанайская область': [53.2, 63.6333],
  'Кызылординская область': [44.85, 65.5167],
  'Мангистауская область': [43.65, 51.15],
  'Павлодарская область': [52.2833, 76.95],
  'Северо-Казахстанская область': [54.8833, 69.15],
  'Туркестанская область': [43.3, 68.25],
  'Ұлытау облысы': [47.6, 67.5],
  'Жетісу облысы': [45.0, 79.0],
  'Абай облысы': [49.0, 80.0],
  'Алматы': [43.238949, 76.945465],
  'Астана': [51.1605, 71.4704],
  'Шымкент': [42.3167, 69.5833],
};

const INCIDENT_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
</svg>`;

const OBJECT_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
  <polyline points="9 22 9 12 15 12 15 22"/>
</svg>`;

export function LeafletMap({
  incidents = [],
  objects = [],
  onMarkerClick,
  onMapClick,
  onAddMarker,
  onDeleteMarker,
  onSelectExisting,
  showIncidents = true,
  showObjects = true,
  selectedRegion = 'all',
  editable = false,
  allIncidents = [],
  allObjects = [],
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const { toast } = useToast();
  
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [clickedPosition, setClickedPosition] = useState<[number, number] | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMarkerType, setNewMarkerType] = useState<'incident' | 'object'>('incident');
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');
  const [isMarkMode, setIsMarkMode] = useState(false);
  
  // Refs для отслеживания текущего состояния (должны быть объявлены ДО useEffect)
  const isMarkModeRef = useRef(isMarkMode);
  const editableRef = useRef(editable);
  
  // Синхронизируем refs с текущими значениями
  useEffect(() => {
    isMarkModeRef.current = isMarkMode;
  }, [isMarkMode]);
  
  useEffect(() => {
    editableRef.current = editable;
  }, [editable]);

  const createIncidentIcon = useCallback(() => {
    const L = window.L;
    return L.divIcon({
      html: `<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${INCIDENT_ICON_SVG.replace('currentColor', 'white')}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: 'incident-marker',
    });
  }, []);

  const createObjectIcon = useCallback(() => {
    const L = window.L;
    return L.divIcon({
      html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${OBJECT_ICON_SVG.replace('currentColor', 'white')}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      className: 'object-marker',
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    if (!L) {
      console.error('Leaflet not loaded');
      return;
    }

    const map = L.map(mapRef.current, {
      center: KAZAKHSTAN_CENTER,
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      maxBounds: KAZAKHSTAN_BOUNDS,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    
    // Устанавливаем Leaflet обработчик клика сразу при инициализации
    map.on('click', (e: any) => {
      // Проверяем режим через ref для актуального значения
      if (!isMarkModeRef.current && !editableRef.current) return;
      
      const { lat, lng } = e.latlng;
      setClickedPosition([lat, lng]);
      setShowAddDialog(true);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);
  
  // DOM-обработчик клика как резервный вариант
  const handleContainerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Проверяем режим отметки или редактирования
    if ((!isMarkMode && !editable) || !mapInstanceRef.current) return;
    
    // Проверяем, что клик не на элементах управления
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('.leaflet-control') || target.closest('[role="dialog"]')) {
      return;
    }
    
    // Leaflet обработчик уже должен был сработать, но на всякий случай проверяем
    // Не вызываем повторно если диалог уже открыт
    if (showAddDialog) return;
    
    // Получаем координаты клика относительно контейнера карты
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Преобразуем пиксели в координаты карты
    const map = mapInstanceRef.current;
    const point = map.containerPointToLatLng([x, y]);
    
    setClickedPosition([point.lat, point.lng]);
    setShowAddDialog(true);
    onMapClick?.(point.lat, point.lng);
  }, [isMarkMode, editable, onMapClick, showAddDialog]);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const L = window.L;
    markersLayerRef.current.clearLayers();

    const allMarkers: MarkerData[] = [];
    
    if (showIncidents) {
      allMarkers.push(...incidents);
    }
    
    if (showObjects) {
      allMarkers.push(...objects);
    }

    allMarkers.forEach((marker) => {
      if (!marker.latitude || !marker.longitude) return;

      const icon = marker.type === 'incident' ? createIncidentIcon() : createObjectIcon();
      
      const leafletMarker = L.marker([marker.latitude, marker.longitude], { icon })
        .addTo(markersLayerRef.current);

      const popupContent = document.createElement('div');
      popupContent.className = 'p-2 min-w-[200px]';
      popupContent.innerHTML = `
        <div class="font-semibold text-sm mb-2">${marker.title}</div>
        <div class="text-xs space-y-1 text-gray-600">
          ${marker.type === 'incident' ? `
            <div><strong>Тип:</strong> ${marker.details.incidentType || 'Пожар'}</div>
            <div><strong>Дата:</strong> ${marker.details.dateTime ? new Date(marker.details.dateTime).toLocaleDateString('ru-RU') : 'Н/Д'}</div>
            <div><strong>Ущерб:</strong> ${marker.details.damage ? Number(marker.details.damage).toLocaleString('ru-RU') + ' тг.' : 'Н/Д'}</div>
            <div><strong>Адрес:</strong> ${marker.details.address || 'Н/Д'}</div>
          ` : `
            <div><strong>Категория:</strong> ${marker.details.category || 'Н/Д'}</div>
            <div><strong>Статус:</strong> ${marker.details.status || 'Активен'}</div>
            <div><strong>Адрес:</strong> ${marker.details.address || 'Н/Д'}</div>
            <div><strong>Риск:</strong> ${marker.details.riskLevel || 'Средний'}</div>
          `}
        </div>
        ${editable ? `
          <div class="flex gap-2 mt-3 pt-2 border-t">
            <button class="edit-btn text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Изменить</button>
            <button class="delete-btn text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Удалить</button>
          </div>
        ` : ''}
      `;

      if (editable) {
        const editBtn = popupContent.querySelector('.edit-btn');
        const deleteBtn = popupContent.querySelector('.delete-btn');
        
        editBtn?.addEventListener('click', () => {
          setSelectedMarker(marker);
          onMarkerClick?.(marker);
        });

        deleteBtn?.addEventListener('click', () => {
          if (confirm('Удалить маркер?')) {
            onDeleteMarker?.(marker.id, marker.type);
            leafletMarker.remove();
          }
        });
      }

      leafletMarker.bindPopup(popupContent);

      leafletMarker.on('click', () => {
        onMarkerClick?.(marker);
      });
    });
  }, [incidents, objects, showIncidents, showObjects, editable, createIncidentIcon, createObjectIcon, onMarkerClick, onDeleteMarker]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const center = selectedRegion !== 'all' && REGION_CENTERS[selectedRegion] 
      ? REGION_CENTERS[selectedRegion] 
      : KAZAKHSTAN_CENTER;
    
    const zoom = selectedRegion !== 'all' ? 8 : 5;
    
    mapInstanceRef.current.flyTo(center, zoom);
  }, [selectedRegion]);

  const handleSearch = async () => {
    if (!searchAddress.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress + ', Kazakhstan')}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const { lat, lon } = data[0];
        mapInstanceRef.current?.flyTo([parseFloat(lat), parseFloat(lon)], 14);
        
        if (editable) {
          setClickedPosition([parseFloat(lat), parseFloat(lon)]);
          setShowAddDialog(true);
        }
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
      setIsSearching(false);
    }
  };

  const handleAddMarker = () => {
    if (clickedPosition) {
      if (selectedExistingId && onSelectExisting) {
        onSelectExisting(newMarkerType, selectedExistingId, clickedPosition[0], clickedPosition[1]);
      } else if (onAddMarker) {
        onAddMarker({
          type: newMarkerType,
          latitude: clickedPosition[0],
          longitude: clickedPosition[1],
        });
      }
    }
    setShowAddDialog(false);
    setClickedPosition(null);
    setSelectedExistingId('');
    setIsMarkMode(false);
  };

  const existingItems = newMarkerType === 'incident' ? allIncidents : allObjects;

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg">
        <div className="flex gap-2">
          <Input
            placeholder="Поиск по адресу..."
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-64"
          />
          <Button onClick={handleSearch} disabled={isSearching} size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>
        
        <Button
          variant={isMarkMode ? "default" : "outline"}
          onClick={() => {
            setIsMarkMode(!isMarkMode);
            if (!isMarkMode) {
              toast({
                title: 'Режим отметки',
                description: 'Кликните на карту, чтобы отметить инцидент или объект',
              });
            }
          }}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Отметить на карте
        </Button>

        {editable && (
          <Button
            variant="outline"
            onClick={() => {
              toast({
                title: 'Добавление маркера',
                description: 'Кликните на карту, чтобы добавить маркер',
              });
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить
          </Button>
        )}
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
        <div className="text-sm font-semibold mb-2">Легенда</div>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span>Происшествие</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500" />
            <span>Объект контроля</span>
          </div>
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отметить на карте</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Что вы хотите отметить?</Label>
              <Select value={newMarkerType} onValueChange={(v: 'incident' | 'object') => {
                setNewMarkerType(v);
                setSelectedExistingId('');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incident">Происшествие</SelectItem>
                  <SelectItem value="object">Объект контроля</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Выберите из списка</Label>
              <Select value={selectedExistingId} onValueChange={setSelectedExistingId}>
                <SelectTrigger>
                  <SelectValue placeholder={newMarkerType === 'incident' ? "Выберите инцидент..." : "Выберите объект..."} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {existingItems.length > 0 ? (
                    existingItems.map((item: any) => (
                      <SelectItem key={String(item.id)} value={String(item.id)}>
                        {newMarkerType === 'incident' 
                          ? `${item.dateTime ? new Date(item.dateTime).toLocaleDateString('ru-RU') : 'Дата неизвестна'} - ${item.address || 'Без адреса'}`
                          : item.name || item.title || 'Без названия'}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__empty__">Список пуст</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {clickedPosition && (
              <div className="text-sm text-gray-500 bg-muted p-2 rounded">
                Выбранные координаты: {clickedPosition[0].toFixed(6)}, {clickedPosition[1].toFixed(6)}
              </div>
            )}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                setSelectedExistingId('');
              }}>
                Отмена
              </Button>
              <Button onClick={handleAddMarker} disabled={!selectedExistingId || selectedExistingId === '__empty__'}>
                Сохранить отметку
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div 
        ref={mapRef} 
        className={`w-full h-full min-h-[500px] ${isMarkMode ? 'cursor-crosshair' : ''}`}
        onClick={handleContainerClick}
      />
    </div>
  );
}
