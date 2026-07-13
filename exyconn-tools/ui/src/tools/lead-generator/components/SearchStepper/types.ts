export type LocationMode = 'current' | 'search' | 'drag';

export interface SearchStepperProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  maxResults: number;
  onMaxResultsChange: (value: number) => void;
  onSearch: () => void;
  isSearching: boolean;
  hasPolygon: boolean;
  onDrawPolygon: () => void;
  hasApiKey: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  onLocationModeChange?: (mode: LocationMode) => void;
}

export interface LocationStepProps {
  locationMode: LocationMode | null;
  locationName: string | null;
  locationError: string | null;
  isGettingLocation: boolean;
  searchLocation: string;
  hasApiKey: boolean;
  onCurrentLocation: () => void;
  onSearchLocation: () => void;
  onDragOnMap: () => void;
  onSearchLocationChange: (value: string) => void;
  onClearError: () => void;
}

export interface CategoryStepProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onBack: () => void;
  onNext: () => void;
  canProceed: boolean;
}

export interface DrawAreaStepProps {
  hasPolygon: boolean;
  hasApiKey: boolean;
  onDrawPolygon: () => void;
  onBack: () => void;
  onNext: () => void;
}

export interface SearchStepProps {
  maxResults: number;
  onMaxResultsChange: (value: number) => void;
  locationName: string | null;
  hasPolygon: boolean;
  selectedTypes: string[];
  searchQuery: string;
  isSearching: boolean;
  canSearch: boolean;
  onSearch: () => void;
  onBack: () => void;
}
