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
    apiKey: string,
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

export const useBusinessSearch = (): UseBusinessSearchResult => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (
      apiKey: string,
      polygonCoordinates: PolygonCoordinates[],
      searchQuery: string,
      selectedTypes: string[],
      maxResults: number
    ) => {
      if (!apiKey) {
        setError('Please configure your Google Places API key in settings');
        return;
      }

      if (polygonCoordinates.length < 3) {
        setError('Please draw a polygon with at least 3 points');
        return;
      }

      setIsSearching(true);
      setError(null);
      setBusinesses([]);

      try {
        const center = calculatePolygonCenter(polygonCoordinates);

        let maxDistance = 0;
        polygonCoordinates.forEach((coord) => {
          const distance = Math.sqrt(Math.pow(coord.lat - center.lat, 2) + Math.pow(coord.lng - center.lng, 2));
          if (distance > maxDistance) maxDistance = distance;
        });
        const radiusMeters = Math.min(maxDistance * 111000, 50000);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const google = (window as any).google;

        if (!google || !google.maps || !google.maps.places) {
          setError('Google Places library not loaded. Please refresh the page.');
          setIsSearching(false);
          return;
        }

        const mapDiv = document.createElement('div');
        const placesService = new google.maps.places.PlacesService(mapDiv);

        const allResults: Business[] = [];
        const searchTerms = searchQuery.trim()
          ? [searchQuery]
          : selectedTypes.length > 0
            ? selectedTypes
            : ['business'];

        for (const term of searchTerms) {
          await new Promise<void>((resolve) => {
            const request = {
              location: new google.maps.LatLng(center.lat, center.lng),
              radius: radiusMeters,
              keyword: term.replace(/_/g, ' '),
            };

            placesService.nearbySearch(
              request,
              (results: google.maps.places.PlaceResult[] | null, status: google.maps.places.PlacesServiceStatus) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                  for (const place of results) {
                    if (allResults.length >= maxResults) break;
                    if (!place.geometry?.location) continue;

                    const location = {
                      lat: place.geometry.location.lat(),
                      lng: place.geometry.location.lng(),
                    };

                    if (!isPointInPolygon(location, polygonCoordinates)) continue;
                    if (allResults.some((b) => b.placeId === place.place_id)) continue;

                    placesService.getDetails(
                      { placeId: place.place_id, fields: ['formatted_phone_number', 'website'] },
                      (details: google.maps.places.PlaceResult | null) => {
                        if (allResults.length >= maxResults) return;

                        const business: Business = {
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
                        };

                        allResults.push(business);
                        setBusinesses([...allResults].slice(0, maxResults));
                      }
                    );
                  }
                }
                resolve();
              }
            );
          });

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
