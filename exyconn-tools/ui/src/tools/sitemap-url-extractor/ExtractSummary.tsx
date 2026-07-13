import React from 'react';
import { Paper, Box, Typography, Chip, Stack } from '@mui/material';
import { ExtractResult } from './types';

interface ExtractSummaryProps {
  result: ExtractResult;
}

const ExtractSummary: React.FC<ExtractSummaryProps> = ({ result }) => (
  <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
      Summary
    </Typography>
    <Stack spacing={1}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Total URLs
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {result.totalCount.toLocaleString()}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="body2" color="text.secondary">
          Sitemap Type
        </Typography>
        <Chip label={result.sitemapType} size="small" />
      </Box>
      {result.childSitemaps && result.childSitemaps.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Child Sitemaps
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {result.childSitemaps.length}
          </Typography>
        </Box>
      )}
    </Stack>
  </Paper>
);

export default ExtractSummary;
