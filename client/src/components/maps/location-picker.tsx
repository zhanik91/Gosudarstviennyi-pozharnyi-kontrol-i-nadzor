import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

interface LocationPickerProps {
  latitude?: string;
  longitude?: string;
  onLocationSelect: (lat: string, lng: string) => void;
  address?: string;
}

const KAZAKHSTAN_CENTER: [number, number] = [48.0196, 66.9237];
const KAZAKHSTAN_BOUNDS: [[number, number], [number, number]] = [[40.5, 46.5], [55.5, 87.5]];

export function LocationPicker({ latitude, longitude, onLocationSelect, address }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const { toast } = useToast();

  const initMap = useCallback(() => {
    if (!window.L || !mapRef.current) {
      setMapError('Leaflet не загружен');
      return false;
    }

    try {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }

      const initialLat = latitude ? parseFloat(latitude) : KAZAKHSTAN_CENTER[0];
      const initialLng = longitude ? parseFloat(longitude) : KAZAKHSTAN_CENTER[1];
      const hasCoords = latitude && longitude;

      const map = window.L.map(mapRef.current, {
        center: [initialLat, initialLng],
        zoom: hasCoords ? 14 : 5,
        maxBounds: KAZAKHSTAN_BOUNDS,
        minZoom: 4,
        maxZoom: 18
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      if (hasCoords) {
        markerRef.current = window.L.marker([initialLat, initialLng], {
          draggable: true
        }).addTo(map);

        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          onLocationSelect(pos.lat.toFixed(7), pos.lng.toFixed(7));
        });
      }

      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = window.L.marker([lat, lng], {
            draggable: true
          }).addTo(map);

          markerRef.current.on('dragend', () => {
            const pos = markerRef.current.getLatLng();
            onLocationSelect(pos.lat.toFixed(7), pos.lng.toFixed(7));
          });
        }

        onLocationSelect(lat.toFixed(7), lng.toFixed(7));
        toast({
          title: 'Координаты выбраны',
          description: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        });
      });

      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
        setIsMapLoading(false);
      }, 200);

      return true;
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError('Ошибка инициализации карты');
      setIsMapLoading(false);
      return false;
    }
  }, [latitude, longitude, onLocationSelect, toast]);

  useEffect(() => {
    if (!isOpen) {
      setIsMapLoading(true);
      setMapError(null);
      return;
    }

    if (!mapRef.current) return;

    const tryInitMap = () => {
      if (window.L) {
        initMap();
      } else {
        let attempts = 0;
        const maxAttempts = 50;
        const checkLeaflet = setInterval(() => {
          attempts++;
          if (window.L) {
            clearInterval(checkLeaflet);
            initMap();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkLeaflet);
            setMapError('Не удалось загрузить библиотеку карт. Обновите страницу.');
            setIsMapLoading(false);
          }
        }, 100);
        return () => clearInterval(checkLeaflet);
      }
    };

    const timeoutId = setTimeout(tryInitMap, 100);

    return () => {
      clearTimeout(timeoutId);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen, initMap]);

  const handleSearch = async () => {
    const query = searchAddress || address;
    if (!query) {
      toast({ title: 'Введите адрес для поиска', variant: 'destructive' });
      return;
    }

    setIsSearching(true);
    try {
      const searchQuery = `${query}, Kazakhstan`;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latNum, lonNum], 15);

          if (markerRef.current) {
            markerRef.current.setLatLng([latNum, lonNum]);
          } else {
            markerRef.current = window.L.marker([latNum, lonNum], {
              draggable: true
            }).addTo(mapInstanceRef.current);

            markerRef.current.on('dragend', () => {
              const pos = markerRef.current.getLatLng();
              onLocationSelect(pos.lat.toFixed(7), pos.lng.toFixed(7));
            });
          }
        }

        onLocationSelect(lat, lon);
        toast({
          title: 'Адрес найден',
          description: `${latNum.toFixed(6)}, ${lonNum.toFixed(6)}`
        });
      } else {
        toast({ title: 'Адрес не найден', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка поиска', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const hasLocation = latitude && longitude;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full gap-2" data-testid="button-open-location-picker">
          <MapPin className="w-4 h-4" />
          {hasLocation ? `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}` : 'Указать на карте'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl" aria-describedby="location-picker-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Выберите место на карте
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p id="location-picker-description" className="sr-only">
            Выберите местоположение на карте кликом или найдите адрес через поиск
          </p>
          
          <div className="flex gap-2">
            <Input
              placeholder="Поиск по адресу..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              data-testid="input-search-address"
            />
            <Button type="button" onClick={handleSearch} disabled={isSearching} data-testid="button-search-address">
              <Search className="w-4 h-4 mr-2" />
              {isSearching ? 'Поиск...' : 'Найти'}
            </Button>
          </div>

          <div className="relative">
            {isMapLoading && !mapError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/80 rounded-lg">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Загрузка карты...</span>
                </div>
              </div>
            )}
            
            {mapError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted rounded-lg">
                <div className="flex flex-col items-center gap-2 text-center p-4">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{mapError}</span>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setMapError(null);
                      setIsMapLoading(true);
                      initMap();
                    }}
                  >
                    Повторить
                  </Button>
                </div>
              </div>
            )}

            <div 
              ref={mapRef} 
              className="h-[400px] rounded-lg border bg-muted"
              style={{ minHeight: '400px' }}
              data-testid="location-picker-map"
            />
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Кликните на карту для выбора места или используйте поиск по адресу
          </p>

          {hasLocation && (
            <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="text-sm font-medium">
                Выбрано: {parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}
              </span>
              <Button type="button" size="sm" onClick={() => setIsOpen(false)} data-testid="button-confirm-location">
                Готово
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
