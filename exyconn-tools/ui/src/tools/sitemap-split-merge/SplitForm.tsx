import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Slider,
  LinearProgress,
} from '@mui/material';
import { Language, CallSplit } from '@mui/icons-material';

interface SplitFormProps {
  sitemapUrl: string;
  urlsPerFile: number;
  isLoading: boolean;
  onUrlChange: (url: string) => void;
  onUrlsPerFileChange: (value: number) => void;
  onSplit: () => void;
}

const SplitForm: React.FC<SplitFormProps> = ({
  sitemapUrl,
  urlsPerFile,
  isLoading,
  onUrlChange,
  onUrlsPerFileChange,
  onSplit,
}) => (
  <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Language color="primary" fontSize="small" />
      <Typography variant="subtitle2" fontWeight={600}>
        Sitemap URL to Split
      </Typography>
    </Box>
    <TextField
      fullWidth
      size="small"
      placeholder="https://example.com/sitemap.xml"
      value={sitemapUrl}
      onChange={(e) => onUrlChange(e.target.value)}
      sx={{ mb: 2 }}
    />
    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
      URLs per file: {urlsPerFile.toLocaleString()}
    </Typography>
    <Slider
      value={urlsPerFile}
      onChange={(_, v) => onUrlsPerFileChange(v as number)}
      min={1000}
      max={50000}
      step={1000}
      marks={[
        { value: 1000, label: '1K' },
        { value: 25000, label: '25K' },
        { value: 50000, label: '50K' },
      ]}
      size="small"
      sx={{ mb: 2 }}
    />
    <Button
      fullWidth
      variant="contained"
      onClick={onSplit}
      disabled={isLoading || !sitemapUrl.trim()}
      startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <CallSplit />}
      sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}
    >
      {isLoading ? 'Splitting...' : 'Split Sitemap'}
    </Button>
    {isLoading && <LinearProgress sx={{ mt: 2 }} color="secondary" />}
  </Paper>
);

export default SplitForm;
