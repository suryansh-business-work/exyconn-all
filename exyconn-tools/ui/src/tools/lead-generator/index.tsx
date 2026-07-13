import React, { useState, useCallback, useRef } from 'react';
import { Box, Container, } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { TravelExplore } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import APISettingsPanel from './components/APISettingsPanel';
import MapComponent from './components/MapComponent';
import SearchStepper from './components/SearchStepper';
import { LocationMode } from './components/SearchStepper/types';
import BusinessList from './components/BusinessList';
import NotificationSnackbars from './components/NotificationSnackbars';
import { Business, PolygonCoordinates, APISettings, STORAGE_KEYS } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useBusinessSearch } from './hooks/useBusinessSearch';

const LeadGenerator: React.FC = () => {
  const [settings] = useLocalStorage<APISettings>(STORAGE_KEYS.API_SETTINGS, {
    googleMapsApiKey: '',
    googlePlacesApiKey: '',
  });

  const [polygonCoordinates, setPolygonCoordinates] = useState<PolygonCoordinates[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [locationMode, setLocationMode] = useState<LocationMode | null>(null);
  console.debug('Location mode:', locationMode);

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
    performSearch(settings.googlePlacesApiKey, polygonCoordinates, searchQuery, selectedTypes, maxResults);
  };

  return (
    <ToolLayout toolName="Lead Generator" toolIcon={<TravelExplore />} toolColor="#f59e0b">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <APISettingsPanel />
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
                hasApiKey={!!settings.googleMapsApiKey}
                onLocationChange={handleLocationChange}
                onLocationModeChange={handleLocationModeChange}
              />
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
