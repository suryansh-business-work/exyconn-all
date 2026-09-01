import React, { useState } from 'react';
import { Box, Paper, Stepper, Typography } from '@mui/material';
import MissingKeyAlert from '../../../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { SearchStepperProps, LocationMode } from './types';
import LocationStep from './LocationStep';
import CategoryStep from './CategoryStep';
import DrawAreaStep from './DrawAreaStep';
import SearchStep from './SearchStep';

export type { LocationMode } from './types';

const SearchStepper: React.FC<SearchStepperProps> = ({
  selectedTypes,
  onTypesChange,
  searchQuery,
  onSearchQueryChange,
  maxResults,
  onMaxResultsChange,
  onSearch,
  isSearching,
  hasPolygon,
  onDrawPolygon,
  hasApiKey,
  onLocationChange,
  onLocationModeChange,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [locationMode, setLocationMode] = useState<LocationMode | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleCurrentLocation = () => {
    setIsGettingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange?.(position.coords.latitude, position.coords.longitude);
        setLocationMode('current');
        onLocationModeChange?.('current');
        setLocationName('Current Location');
        setIsGettingLocation(false);
        handleNext();
      },
      (err) => {
        setLocationError(`Location error: ${err.message}`);
        setIsGettingLocation(false);
      }
    );
  };

  const handleSearchLocation = () => {
    if (!searchLocation.trim()) {
      setLocationError('Please enter a location');
      return;
    }
    setIsGettingLocation(true);
    setLocationError(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.maps?.Geocoder) {
      setLocationError('Google Maps not loaded');
      setIsGettingLocation(false);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { address: searchLocation },
      (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          onLocationChange?.(loc.lat(), loc.lng());
          setLocationMode('search');
          onLocationModeChange?.('search');
          setLocationName(results[0].formatted_address);
          setIsGettingLocation(false);
          handleNext();
        } else {
          setLocationError('Location not found');
          setIsGettingLocation(false);
        }
      }
    );
  };

  const handleDragOnMap = () => {
    setLocationMode('drag');
    onLocationModeChange?.('drag');
    setLocationName('Drag to select on map');
    handleNext();
  };

  const canProceedStep0 = locationMode !== null;
  const canProceedStep1 = selectedTypes.length > 0 || searchQuery.trim().length > 0;
  const canProceedStep2 = hasPolygon;

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, bgcolor: 'primary.50', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={600} color="primary.main">
          🔍 Business Search Wizard
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {!hasApiKey && (
          <Box sx={{ mb: 2 }}>
            <MissingKeyAlert
              secretKey="google_maps_api_key"
              hint="The search wizard needs a Google Maps key before it can place and draw an area."
            />
          </Box>
        )}

        <Stepper activeStep={activeStep} orientation="vertical">
          <LocationStep
            locationMode={locationMode}
            locationName={locationName}
            locationError={locationError}
            isGettingLocation={isGettingLocation}
            searchLocation={searchLocation}
            hasApiKey={hasApiKey}
            onCurrentLocation={handleCurrentLocation}
            onSearchLocation={handleSearchLocation}
            onDragOnMap={handleDragOnMap}
            onSearchLocationChange={setSearchLocation}
            onClearError={() => setLocationError(null)}
          />

          <CategoryStep
            selectedTypes={selectedTypes}
            onTypesChange={onTypesChange}
            searchQuery={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
            onBack={handleBack}
            onNext={handleNext}
            canProceed={canProceedStep1}
          />

          <DrawAreaStep
            hasPolygon={hasPolygon}
            hasApiKey={hasApiKey}
            onDrawPolygon={onDrawPolygon}
            onBack={handleBack}
            onNext={handleNext}
          />

          <SearchStep
            maxResults={maxResults}
            onMaxResultsChange={onMaxResultsChange}
            locationName={locationName}
            hasPolygon={hasPolygon}
            selectedTypes={selectedTypes}
            searchQuery={searchQuery}
            isSearching={isSearching}
            canSearch={canProceedStep0 && canProceedStep1 && canProceedStep2}
            onSearch={onSearch}
            onBack={handleBack}
          />
        </Stepper>
      </Box>
    </Paper>
  );
};

export default SearchStepper;
