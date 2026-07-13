import React from 'react';
import { Paper, Box, Typography, IconButton, Tooltip } from '@mui/material';
import { Download } from '@mui/icons-material';
import { SplitResult } from './types';

interface SplitSummaryProps {
  result: SplitResult;
  onDownloadAll: () => void;
}

const SplitSummary: React.FC<SplitSummaryProps> = ({ result, onDownloadAll }) => (
  <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        Split Results
      </Typography>
      <Tooltip title="Download All">
        <IconButton size="small" onClick={onDownloadAll}>
          <Download fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
    <Typography variant="body2" color="text.secondary">
      Total URLs: <strong>{result.totalUrls.toLocaleString()}</strong>
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Split into: <strong>{result.sitemaps.length} files</strong>
    </Typography>
  </Paper>
);

export default SplitSummary;
