import React from 'react';
import {
  Box,
  Step,
  StepLabel,
  StepContent,
  Button,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import { MyLocation, LocationOn, Place } from '@mui/icons-material';
import { LocationStepProps } from './types';

const LocationStep: React.FC<LocationStepProps> = ({
  locationMode,
  locationName,
  locationError,
  isGettingLocation,
  searchLocation,
  hasApiKey,
  onCurrentLocation,
  onSearchLocation,
  onDragOnMap,
  onSearchLocationChange,
  onClearError,
}) => {
  const canProceed = locationMode !== null;

  return (
    <Step completed={canProceed}>
      <StepLabel
        optional={
          locationName ? (
            <Typography variant="caption" color="success.main">
              ✓ {locationName}
            </Typography>
          ) : null
        }
      >
        Select Location
      </StepLabel>
      <StepContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose how you want to set your search location.
        </Typography>

        {locationError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={onClearError}>
            {locationError}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant={locationMode === 'current' ? 'contained' : 'outlined'}
            fullWidth
            size="large"
            disabled={isGettingLocation || !hasApiKey}
            onClick={onCurrentLocation}
            startIcon={isGettingLocation ? <CircularProgress size={18} /> : <MyLocation />}
            sx={{ justifyContent: 'flex-start', py: 1.5 }}
          >
            {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="City, area, or address..."
              value={searchLocation}
              onChange={(e) => onSearchLocationChange(e.target.value)}
              disabled={!hasApiKey}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn fontSize="small" />
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') onSearchLocation();
              }}
            />
            <Button
              variant="contained"
              onClick={onSearchLocation}
              disabled={isGettingLocation || !hasApiKey || !searchLocation.trim()}
              sx={{ minWidth: 80 }}
            >
              Go
            </Button>
          </Box>

          <Button
            variant={locationMode === 'drag' ? 'contained' : 'outlined'}
            fullWidth
            size="large"
            disabled={!hasApiKey}
            onClick={onDragOnMap}
            startIcon={<Place />}
            sx={{ justifyContent: 'flex-start', py: 1.5 }}
          >
            Drag & Select on Map
          </Button>
        </Box>
      </StepContent>
    </Step>
  );
};

export default LocationStep;
