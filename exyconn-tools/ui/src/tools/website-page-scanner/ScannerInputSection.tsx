import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Slider,
  Stack,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import { Search, Download, Language } from '@mui/icons-material';
import { ScanResult } from './types';

interface ScannerInputSectionProps {
  websiteUrl: string;
  maxPages: number;
  isLoading: boolean;
  result: ScanResult | null;
  onUrlChange: (value: string) => void;
  onMaxPagesChange: (value: number) => void;
  onScan: () => void;
  onExportJSON: () => void;
}

const ScannerInputSection: React.FC<ScannerInputSectionProps> = ({
  websiteUrl,
  maxPages,
  isLoading,
  result,
  onUrlChange,
  onMaxPagesChange,
  onScan,
  onExportJSON,
}) => {
  return (
    <>
      <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Language color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>
            Enter Website URL
          </Typography>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="https://example.com"
          value={websiteUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Typography variant="caption" color="text.secondary" gutterBottom display="block">
          Max Pages to Scan: {maxPages}
        </Typography>
        <Slider
          value={maxPages}
          onChange={(_, v) => onMaxPagesChange(v as number)}
          min={5}
          max={50}
          step={5}
          marks
          size="small"
          sx={{ mb: 2 }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={onScan}
          disabled={isLoading || !websiteUrl.trim()}
          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <Search />}
        >
          {isLoading ? 'Scanning...' : 'Scan Pages'}
        </Button>
        {isLoading && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Crawling pages, this may take a moment...
            </Typography>
            <LinearProgress sx={{ mt: 1 }} />
          </Box>
        )}
      </Paper>

      {result && (
        <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Summary
            </Typography>
            <Tooltip title="Export JSON">
              <IconButton size="small" onClick={onExportJSON}>
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Pages Scanned
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {result.totalPages}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Total Words
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {result.pages.reduce((a, p) => a + p.wordCount, 0).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Total Images
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {result.pages.reduce((a, p) => a + p.images, 0)}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}
    </>
  );
};

export default ScannerInputSection;
