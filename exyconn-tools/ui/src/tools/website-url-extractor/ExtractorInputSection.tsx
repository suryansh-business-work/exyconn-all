import React from 'react';
import { Paper, Box, Typography, TextField, Button, CircularProgress, Chip, Stack } from '@mui/material';
import { Search, Language } from '@mui/icons-material';
import { ExtractionResult } from './types';

interface ExtractorInputSectionProps {
  websiteUrl: string;
  isLoading: boolean;
  result: ExtractionResult | null;
  onUrlChange: (value: string) => void;
  onExtract: () => void;
}

const ExtractorInputSection: React.FC<ExtractorInputSectionProps> = ({
  websiteUrl,
  isLoading,
  result,
  onUrlChange,
  onExtract,
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
        <Button
          fullWidth
          variant="contained"
          onClick={onExtract}
          disabled={isLoading || !websiteUrl.trim()}
          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <Search />}
        >
          {isLoading ? 'Extracting...' : 'Extract URLs'}
        </Button>
      </Paper>

      {result && (
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
                {result.totalUrls}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Internal
              </Typography>
              <Chip label={result.internalCount} size="small" color="success" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                External
              </Typography>
              <Chip label={result.externalCount} size="small" color="warning" />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Resources
              </Typography>
              <Chip label={result.resourceCount} size="small" color="info" />
            </Box>
          </Stack>
        </Paper>
      )}
    </>
  );
};

export default ExtractorInputSection;
