import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import MissingKeyAlert from '../../../../shared/components/MissingKeyAlert/MissingKeyAlert';

interface MapLoadingStatesProps {
  apiKey: string;
  loadError: Error | undefined;
  isLoaded: boolean;
}

const MapLoadingStates: React.FC<MapLoadingStatesProps> = ({ apiKey, loadError, isLoaded }) => {
  if (!apiKey) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 2,
        }}
      >
        <MissingKeyAlert
          secretKey="google_maps_api_key"
          hint="The map needs a Google Maps key to draw your search area."
        />
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 2,
        }}
      >
        <Alert severity="error">
          Failed to load Google Maps. Please check your API key and ensure the Maps JavaScript API is enabled.
        </Alert>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: 2,
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography color="text.secondary">Loading Google Maps...</Typography>
      </Box>
    );
  }

  return null;
};

export default MapLoadingStates;
