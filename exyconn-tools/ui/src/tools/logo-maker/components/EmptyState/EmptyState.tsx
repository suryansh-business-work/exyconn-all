import React from 'react';
import { Paper, Typography } from '@mui/material';
import { ImageSearch } from '@mui/icons-material';

const EmptyState: React.FC = () => (
  <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: 1, borderColor: 'divider', borderStyle: 'dashed' }}>
    <ImageSearch sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
    <Typography variant="h6" color="text.secondary" gutterBottom>
      No Image Uploaded
    </Typography>
    <Typography variant="body2" color="text.disabled">
      Upload a logo to see previews in different sizes
    </Typography>
  </Paper>
);

export default EmptyState;
