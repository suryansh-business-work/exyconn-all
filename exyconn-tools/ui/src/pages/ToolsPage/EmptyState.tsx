import React from 'react';
import { Box, Typography } from '@mui/material';

const EmptyState: React.FC = () => (
  <Box sx={{ textAlign: 'center', py: 8 }}>
    <Typography variant="h6" color="text.secondary" gutterBottom>
      No tools found
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Try a different search term or category
    </Typography>
  </Box>
);

export default EmptyState;
