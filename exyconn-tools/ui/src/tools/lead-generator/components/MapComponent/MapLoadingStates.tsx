import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';

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
        <Alert severity="info">Please configure your Google Maps API key in the settings above to use the map.</Alert>
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
