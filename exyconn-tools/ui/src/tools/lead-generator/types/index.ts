export interface Business {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  totalRatings?: number;
  types: string[];
  location: {
    lat: number;
    lng: number;
  };
  isOpen?: boolean;
  priceLevel?: number;
}

export interface PolygonCoordinates {
  lat: number;
  lng: number;
}

export interface SearchArea {
  id: string;
  name: string;
  polygon: PolygonCoordinates[];
  createdAt: string;
}

export interface APISettings {
  googleMapsApiKey: string;
  googlePlacesApiKey: string;
}

export interface LeadGeneratorState {
  searchQuery: string;
  searchType: string;
  businesses: Business[];
  selectedArea: SearchArea | null;
  isDrawing: boolean;
  isSearching: boolean;
  savedAreas: SearchArea[];
}

export interface BusinessType {
  id: string;
  label: string;
  icon: string;
  popular?: boolean;
}

export const businessTypes: BusinessType[] = [
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️', popular: true },
  { id: 'cafe', label: 'Cafes', icon: '☕', popular: true },
  { id: 'store', label: 'Retail Stores', icon: '🛒', popular: true },
  { id: 'gym', label: 'Gyms & Fitness', icon: '💪', popular: true },
  { id: 'salon', label: 'Salons & Spas', icon: '💇' },
  { id: 'hotel', label: 'Hotels', icon: '🏨' },
  { id: 'hospital', label: 'Hospitals', icon: '🏥' },
  { id: 'pharmacy', label: 'Pharmacies', icon: '💊' },
  { id: 'bank', label: 'Banks', icon: '🏦' },
  { id: 'gas_station', label: 'Gas Stations', icon: '⛽' },
  { id: 'car_repair', label: 'Auto Repair', icon: '🔧' },
  { id: 'real_estate_agency', label: 'Real Estate', icon: '🏠' },
  { id: 'lawyer', label: 'Law Firms', icon: '⚖️' },
  { id: 'accounting', label: 'Accounting', icon: '📊' },
  { id: 'dentist', label: 'Dentists', icon: '🦷' },
  { id: 'doctor', label: 'Doctors', icon: '👨‍⚕️' },
  { id: 'veterinary_care', label: 'Veterinary', icon: '🐾' },
  { id: 'school', label: 'Schools', icon: '🎓' },
  { id: 'supermarket', label: 'Supermarkets', icon: '🛒' },
];

export const DEFAULT_CENTER = { lat: 28.6139, lng: 77.209 }; // Delhi, India
export const DEFAULT_ZOOM = 13;

export const STORAGE_KEYS = {
  API_SETTINGS: 'lead-generator-api-settings',
  SAVED_AREAS: 'lead-generator-saved-areas',
  SAVED_LEADS: 'lead-generator-saved-leads',
};
