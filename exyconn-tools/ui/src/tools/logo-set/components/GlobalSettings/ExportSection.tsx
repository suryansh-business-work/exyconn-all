import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Typography, Divider, Chip } from '@mui/material';
import { ExportFormat } from '../../types';
import { ExportFormatSelectorProps } from './types';

const ExportSection: React.FC<ExportFormatSelectorProps> = ({ format, onFormatChange }) => (
  <Box>
    <Divider sx={{ my: 1 }}>
      <Chip label="Export" size="small" sx={{ fontSize: '0.65rem' }} />
    </Divider>

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Format:
      </Typography>
      <ToggleButtonGroup value={format} exclusive onChange={(_, v) => v && onFormatChange(v)} size="small">
        {(['png', 'jpg', 'webp'] as ExportFormat[]).map((f) => (
          <ToggleButton key={f} value={f} sx={{ px: 1, py: 0.25, fontSize: '0.65rem' }}>
            {f.toUpperCase()}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  </Box>
);

export default ExportSection;
