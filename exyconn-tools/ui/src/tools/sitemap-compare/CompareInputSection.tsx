import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Stack,
  LinearProgress,
} from '@mui/material';
import { CompareArrows, Language, Add, Remove, Edit } from '@mui/icons-material';
import { CompareResult } from './types';

interface CompareInputSectionProps {
  sitemap1: string;
  sitemap2: string;
  isLoading: boolean;
  result: CompareResult | null;
  onSitemap1Change: (value: string) => void;
  onSitemap2Change: (value: string) => void;
  onCompare: () => void;
}

const CompareInputSection: React.FC<CompareInputSectionProps> = ({
  sitemap1,
  sitemap2,
  isLoading,
  result,
  onSitemap1Change,
  onSitemap2Change,
  onCompare,
}) => {
  return (
    <>
      <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Language color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>
            Old Sitemap (Before)
          </Typography>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="https://example.com/sitemap-old.xml"
          value={sitemap1}
          onChange={(e) => onSitemap1Change(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Language color="secondary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>
            New Sitemap (After)
          </Typography>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="https://example.com/sitemap-new.xml"
          value={sitemap2}
          onChange={(e) => onSitemap2Change(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={onCompare}
          disabled={isLoading || !sitemap1.trim() || !sitemap2.trim()}
          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <CompareArrows />}
          sx={{ bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
        >
          {isLoading ? 'Comparing...' : 'Compare Sitemaps'}
        </Button>
        {isLoading && <LinearProgress sx={{ mt: 2 }} color="warning" />}
      </Paper>

      {result && (
        <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Comparison Summary
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Old Sitemap URLs
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {result.summary.sitemap1Count}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                New Sitemap URLs
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {result.summary.sitemap2Count}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Added
              </Typography>
              <Chip label={result.summary.addedCount} size="small" color="success" icon={<Add />} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Removed
              </Typography>
              <Chip label={result.summary.removedCount} size="small" color="error" icon={<Remove />} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Modified
              </Typography>
              <Chip label={result.summary.modifiedCount} size="small" color="warning" icon={<Edit />} />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                Unchanged
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {result.unchanged}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}
    </>
  );
};

export default CompareInputSection;
