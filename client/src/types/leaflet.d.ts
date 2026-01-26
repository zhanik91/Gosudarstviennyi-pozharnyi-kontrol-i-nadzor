declare module 'leaflet' {
  export interface Map {
    setView(center: [number, number], zoom: number): this;
    invalidateSize(): this;
    on(event: string, fn: (e: any) => void): this;
    remove(): void;
    fitBounds(bounds: [[number, number], [number, number]]): this;
  }

  export interface Marker {
    setLatLng(latlng: [number, number]): this;
    getLatLng(): { lat: number; lng: number };
    addTo(map: Map | LayerGroup): this;
    on(event: string, fn: (e: any) => void): this;
    bindPopup(content: string | HTMLElement): this;
  }

  export interface LayerGroup {
    addTo(map: Map): this;
    clearLayers(): this;
  }

  export interface TileLayer {
    addTo(map: Map): this;
  }

  export interface Icon {}
  export interface DivIcon {}

  export function map(element: HTMLElement, options?: any): Map;
  export function marker(latlng: [number, number], options?: any): Marker;
  export function tileLayer(urlTemplate: string, options?: any): TileLayer;
  export function layerGroup(): LayerGroup;
  export function divIcon(options: any): DivIcon;
  export function icon(options: any): Icon;
}
