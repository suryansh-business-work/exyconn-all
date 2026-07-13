import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { Language, Link } from '@mui/icons-material';

interface ExtractFormProps {
  sitemapUrl: string;
  isLoading: boolean;
  onUrlChange: (url: string) => void;
  onExtract: () => void;
}

const ExtractForm: React.FC<ExtractFormProps> = ({
  sitemapUrl,
  isLoading,
  onUrlChange,
  onExtract,
}) => (
  <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Language color="primary" fontSize="small" />
      <Typography variant="subtitle2" fontWeight={600}>
        Sitemap URL
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
    <Button
      fullWidth
      variant="contained"
      onClick={onExtract}
      disabled={isLoading || !sitemapUrl.trim()}
      startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <Link />}
      sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
    >
      {isLoading ? 'Extracting...' : 'Extract URLs'}
    </Button>
    {isLoading && <LinearProgress sx={{ mt: 2 }} />}
  </Paper>
);

export default ExtractForm;
