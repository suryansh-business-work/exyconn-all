import { Business, PolygonCoordinates } from '../../types';

export interface MapComponentProps {
  businesses: Business[];
  onPolygonComplete: (coordinates: PolygonCoordinates[]) => void;
  onClearPolygon: () => void;
  selectedBusiness: Business | null;
  onBusinessSelect: (business: Business | null) => void;
  polygonCoordinates: PolygonCoordinates[];
  onDrawPolygonRef?: (fn: () => void) => void;
  externalCenter?: { lat: number; lng: number } | null;
}

export interface MapControlsProps {
  isDrawing: boolean;
  hasPolygon: boolean;
  onDraw: () => void;
  onClear: () => void;
  onCenterOnUser: () => void;
}

export interface BusinessInfoWindowProps {
  business: Business;
  onClose: () => void;
}

export interface MapLoadingStateProps {
  apiKey: string;
  loadError: Error | undefined;
  isLoaded: boolean;
}

export const libraries: ('drawing' | 'places')[] = ['drawing', 'places'];

export const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

export const defaultCenter = {
  lat: 40.7128,
  lng: -74.006,
};

export const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
  gestureHandling: 'greedy',
  scrollwheel: true,
};

export const polygonOptions: google.maps.PolygonOptions = {
  fillColor: '#2196f3',
  fillOpacity: 0.2,
  strokeColor: '#1976d2',
  strokeOpacity: 0.8,
  strokeWeight: 2,
  editable: true,
  draggable: false,
};
