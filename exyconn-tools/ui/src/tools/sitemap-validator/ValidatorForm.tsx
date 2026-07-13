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
import { Language, CheckCircle } from '@mui/icons-material';

interface ValidatorFormProps {
  sitemapUrl: string;
  isLoading: boolean;
  onUrlChange: (url: string) => void;
  onValidate: () => void;
}

const ValidatorForm: React.FC<ValidatorFormProps> = ({
  sitemapUrl,
  isLoading,
  onUrlChange,
  onValidate,
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
      color="success"
      onClick={onValidate}
      disabled={isLoading || !sitemapUrl.trim()}
      startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
    >
      {isLoading ? 'Validating...' : 'Validate Sitemap'}
    </Button>
    {isLoading && <LinearProgress color="success" sx={{ mt: 2 }} />}
  </Paper>
);

export default ValidatorForm;
