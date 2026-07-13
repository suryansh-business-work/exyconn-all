import React from 'react';
import { Box, Step, StepLabel, StepContent, Button, Typography, Alert } from '@mui/material';
import { Draw, CheckCircle } from '@mui/icons-material';
import { DrawAreaStepProps } from './types';

const DrawAreaStep: React.FC<DrawAreaStepProps> = ({ hasPolygon, hasApiKey, onDrawPolygon, onBack, onNext }) => (
  <Step completed={hasPolygon}>
    <StepLabel
      optional={
        hasPolygon ? (
          <Typography variant="caption" color="success.main">
            ✓ Area selected
          </Typography>
        ) : null
      }
    >
      Draw Search Area
    </StepLabel>
    <StepContent>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click the button below to draw a polygon on the map. This defines the area where businesses will be searched.
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<Draw />}
          onClick={onDrawPolygon}
          disabled={!hasApiKey}
          sx={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            },
          }}
        >
          Click to Draw Polygon
        </Button>

        {hasPolygon && (
          <Button variant="outlined" onClick={onNext} endIcon={<CheckCircle />}>
            Continue
          </Button>
        )}
      </Box>

      {hasPolygon && (
        <Alert severity="success" sx={{ mt: 2 }} icon={<CheckCircle />}>
          Polygon drawn successfully! Click Continue to search businesses.
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        <Button onClick={onBack}>Back</Button>
      </Box>
    </StepContent>
  </Step>
);

export default DrawAreaStep;
