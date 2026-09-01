import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Container, } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { TravelExplore } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { useSecrets } from '../../shared/context/SecretsContext';
import { readSecret } from '../../shared/services/secrets';
import APISettingsPanel from './components/APISettingsPanel';
import MapComponent from './components/MapComponent';
import SearchStepper from './components/SearchStepper';
import { LocationMode } from './components/SearchStepper/types';
import BusinessList from './components/BusinessList';
import NotificationSnackbars from './components/NotificationSnackbars';
import { Business, PolygonCoordinates } from './types';
import { useBusinessSearch } from './hooks/useBusinessSearch';

const MAPS_KEY = 'google_maps_api_key';
const PLACES_KEY = 'google_places_api_key';

const LeadGenerator: React.FC = () => {
  const { isOpen: secretsOpen } = useSecrets();
  // The keys can be edited in two places — the panel below and the global
  // secrets drawer — and each used to hold its own copy, so a key saved in one
  // stayed invisible to the map and the wizard until a reload.
  const [mapsKey, setMapsKey] = useState(() => readSecret(MAPS_KEY));
  const [needsPlacesKey, setNeedsPlacesKey] = useState(false);

  useEffect(() => {
    if (!secretsOpen) {
      setMapsKey(readSecret(MAPS_KEY));
    }
  }, [secretsOpen]);

  const [polygonCoordinates, setPolygonCoordinates] = useState<PolygonCoordinates[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  // Only the setter is used: the stepper reports its mode up so the re-render
  // keeps the wizard in sync, but no consumer here reads the value back.
  const [, setLocationMode] = useState<LocationMode | null>(null);

  const triggerDrawPolygonRef = useRef<(() => void) | null>(null);

  const {
    businesses,
    isSearching,
    error,
    successMessage,
    setBusinesses,
    setError,
    setSuccessMessage,
    handleSearch: performSearch,
  } = useBusinessSearch();

  const handlePolygonComplete = useCallback((coordinates: PolygonCoordinates[]) => {
    setPolygonCoordinates(coordinates);
  }, []);

  const handleClearPolygon = useCallback(() => {
    setPolygonCoordinates([]);
    setBusinesses([]);
    setSelectedBusiness(null);
  }, [setBusinesses]);

  const handleDrawPolygon = useCallback(() => {
    if (triggerDrawPolygonRef.current) {
      triggerDrawPolygonRef.current();
    }
  }, []);

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setMapCenter({ lat, lng });
  }, []);

  const handleLocationModeChange = useCallback((mode: LocationMode) => {
    setLocationMode(mode);
  }, []);

  const handleSearch = () => {
    const placesKey = readSecret(PLACES_KEY);
    if (!placesKey) {
      setNeedsPlacesKey(true);
      return;
    }
    setNeedsPlacesKey(false);
    performSearch(polygonCoordinates, searchQuery, selectedTypes, maxResults);
  };

  return (
    <ToolLayout toolName="Lead Generator" toolIcon={<TravelExplore />} toolColor="#f59e0b">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <APISettingsPanel onSettingsChange={(next) => setMapsKey(next.googleMapsApiKey)} />
              <SearchStepper
                selectedTypes={selectedTypes}
                onTypesChange={setSelectedTypes}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                maxResults={maxResults}
                onMaxResultsChange={setMaxResults}
                onSearch={handleSearch}
                isSearching={isSearching}
                hasPolygon={polygonCoordinates.length >= 3}
                onDrawPolygon={handleDrawPolygon}
                hasApiKey={!!mapsKey}
                onLocationChange={handleLocationChange}
                onLocationModeChange={handleLocationModeChange}
              />
              {needsPlacesKey && (
                <MissingKeyAlert
                  secretKey={PLACES_KEY}
                  hint="Finding businesses in your area uses the Google Places API with your own key."
                />
              )}
              <BusinessList
                businesses={businesses}
                selectedBusiness={selectedBusiness}
                onBusinessSelect={setSelectedBusiness}
                isLoading={isSearching}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ height: { xs: 400, md: 'calc(100vh - 140px)' }, position: 'sticky', top: 80 }}>
              <MapComponent
                apiKey={mapsKey}
                businesses={businesses}
                onPolygonComplete={handlePolygonComplete}
                onClearPolygon={handleClearPolygon}
                selectedBusiness={selectedBusiness}
                onBusinessSelect={setSelectedBusiness}
                polygonCoordinates={polygonCoordinates}
                onDrawPolygonRef={(fn) => {
                  triggerDrawPolygonRef.current = fn;
                }}
                externalCenter={mapCenter}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>

      <NotificationSnackbars
        error={error}
        successMessage={successMessage}
        onErrorClose={() => setError(null)}
        onSuccessClose={() => setSuccessMessage(null)}
      />
    </ToolLayout>
  );
};

export default LeadGenerator;
