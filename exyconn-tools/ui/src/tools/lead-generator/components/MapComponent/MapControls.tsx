import React from 'react';
import { Box, Button } from '@mui/material';
import { Draw, MyLocation, Delete } from '@mui/icons-material';
import { MapControlsProps } from './types';

const DrawPolygonButton: React.FC<{
  isDrawing: boolean;
  hasPolygon: boolean;
  onDraw: () => void;
}> = ({ isDrawing, hasPolygon, onDraw }) => (
  <Box
    sx={{
      position: 'absolute',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
    }}
  >
    <Button
      variant="contained"
      startIcon={<Draw />}
      onClick={onDraw}
      disabled={isDrawing}
      sx={{
        bgcolor: isDrawing ? 'warning.main' : 'primary.main',
        color: 'white',
        boxShadow: 3,
        '&:hover': {
          bgcolor: isDrawing ? 'warning.dark' : 'primary.dark',
        },
      }}
    >
      {isDrawing ? 'Drawing... Click on map' : hasPolygon ? 'Redraw Polygon' : 'Draw Polygon'}
    </Button>
  </Box>
);

const MapControls: React.FC<MapControlsProps> = ({ isDrawing, hasPolygon, onDraw, onClear, onCenterOnUser }) => (
  <>
    <DrawPolygonButton isDrawing={isDrawing} hasPolygon={hasPolygon} onDraw={onDraw} />

    <Box
      sx={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Button
        variant="contained"
        size="small"
        startIcon={<MyLocation />}
        onClick={onCenterOnUser}
        sx={{
          bgcolor: 'white',
          color: 'text.primary',
          '&:hover': { bgcolor: 'grey.100' },
        }}
      >
        My Location
      </Button>
      {hasPolygon && (
        <Button variant="contained" size="small" color="error" startIcon={<Delete />} onClick={onClear}>
          Clear Area
        </Button>
      )}
    </Box>
  </>
);

export default MapControls;
