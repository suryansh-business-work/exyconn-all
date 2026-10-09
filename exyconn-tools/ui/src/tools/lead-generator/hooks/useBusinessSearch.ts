import { useState, useCallback } from 'react';
import { Business, PolygonCoordinates } from '../types';

interface UseBusinessSearchResult {
  businesses: Business[];
  isSearching: boolean;
  error: string | null;
  successMessage: string | null;
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
  handleSearch: (
    polygonCoordinates: PolygonCoordinates[],
    searchQuery: string,
    selectedTypes: string[],
    maxResults: number
  ) => Promise<void>;
}

const calculatePolygonCenter = (coords: PolygonCoordinates[]): { lat: number; lng: number } => {
  const lat = coords.reduce((sum, c) => sum + c.lat, 0) / coords.length;
  const lng = coords.reduce((sum, c) => sum + c.lng, 0) / coords.length;
  return { lat, lng };
};

const isPointInPolygon = (point: { lat: number; lng: number }, polygon: PolygonCoordinates[]): boolean => {
  let inside = false;
  const x = point.lat;
  const y = point.lng;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
};

const getMaxDistance = (coords: PolygonCoordinates[], center: { lat: number; lng: number }): number => {
  let maxDistance = 0;
  coords.forEach((coord) => {
    const distance = Math.sqrt(Math.pow(coord.lat - center.lat, 2) + Math.pow(coord.lng - center.lng, 2));
    if (distance > maxDistance) maxDistance = distance;
  });
  return maxDistance;
};

const resolveSearchTerms = (searchQuery: string, selectedTypes: string[]): string[] => {
  if (searchQuery.trim()) return [searchQuery];
  if (selectedTypes.length > 0) return selectedTypes;
  return ['business'];
};

interface SearchContext {
  placesService: google.maps.places.PlacesService;
  center: { lat: number; lng: number };
  radiusMeters: number;
  polygon: PolygonCoordinates[];
  maxResults: number;
  allResults: Business[];
  onUpdate: (items: Business[]) => void;
}

const toBusiness = (
  place: google.maps.places.PlaceResult,
  details: google.maps.places.PlaceResult | null,
  location: { lat: number; lng: number }
): Business => ({
  placeId: place.place_id || crypto.randomUUID(),
  name: place.name || 'Unknown',
  address: place.vicinity || place.formatted_address || '',
  location,
  phone: details?.formatted_phone_number,
  website: details?.website,
  rating: place.rating,
  totalRatings: place.user_ratings_total,
  types: place.types || [],
  isOpen: place.opening_hours?.isOpen?.(),
});

const addPlace = (ctx: SearchContext, place: google.maps.places.PlaceResult): void => {
  if (!place.geometry?.location) return;

  const location = {
    lat: place.geometry.location.lat(),
    lng: place.geometry.location.lng(),
  };

  if (!isPointInPolygon(location, ctx.polygon)) return;
  if (ctx.allResults.some((b) => b.placeId === place.place_id)) return;

  ctx.placesService.getDetails(
    { placeId: place.place_id as string, fields: ['formatted_phone_number', 'website'] },
    (details: google.maps.places.PlaceResult | null) => {
      if (ctx.allResults.length >= ctx.maxResults) return;

      ctx.allResults.push(toBusiness(place, details, location));
      ctx.onUpdate([...ctx.allResults].slice(0, ctx.maxResults));
    }
  );
};

const handleNearbyResults = (
  ctx: SearchContext,
  results: google.maps.places.PlaceResult[] | null,
  status: google.maps.places.PlacesServiceStatus
): void => {
  if (status !== google.maps.places.PlacesServiceStatus.OK || !results) return;

  for (const place of results) {
    if (ctx.allResults.length >= ctx.maxResults) break;
    addPlace(ctx, place);
  }
};

const searchTerm = (ctx: SearchContext, term: string): Promise<void> =>
  new Promise<void>((resolve) => {
    const request = {
      location: new google.maps.LatLng(ctx.center.lat, ctx.center.lng),
      radius: ctx.radiusMeters,
      keyword: term.replaceAll('_', ' '),
    };

    ctx.placesService.nearbySearch(request, (results, status) => {
      handleNearbyResults(ctx, results, status);
      resolve();
    });
  });

export const useBusinessSearch = (): UseBusinessSearchResult => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (
      polygonCoordinates: PolygonCoordinates[],
      searchQuery: string,
      selectedTypes: string[],
      maxResults: number
    ) => {
      if (polygonCoordinates.length < 3) {
        setError('Please draw a polygon with at least 3 points');
        return;
      }

      setIsSearching(true);
      setError(null);
      setBusinesses([]);

      try {
        const center = calculatePolygonCenter(polygonCoordinates);
        const radiusMeters = Math.min(getMaxDistance(polygonCoordinates, center) * 111000, 50000);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const google = (globalThis as any).google;

        if (!google?.maps?.places) {
          setError('Google Places library not loaded. Please refresh the page.');
          setIsSearching(false);
          return;
        }

        const allResults: Business[] = [];
        const ctx: SearchContext = {
          placesService: new google.maps.places.PlacesService(document.createElement('div')),
          center,
          radiusMeters,
          polygon: polygonCoordinates,
          maxResults,
          allResults,
          onUpdate: setBusinesses,
        };

        for (const term of resolveSearchTerms(searchQuery, selectedTypes)) {
          await searchTerm(ctx, term);

          if (allResults.length >= maxResults) break;
          await new Promise((r) => setTimeout(r, 200));
        }

        await new Promise((r) => setTimeout(r, 1000));

        if (allResults.length === 0) {
          setError('No businesses found in the selected area. Try expanding the polygon or changing search terms.');
        } else {
          setSuccessMessage(`Found ${allResults.length} businesses in the selected area`);
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search for businesses. Please check your API key and try again.');
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  return {
    businesses,
    isSearching,
    error,
    successMessage,
    setBusinesses,
    setError,
    setSuccessMessage,
    handleSearch,
  };
};
