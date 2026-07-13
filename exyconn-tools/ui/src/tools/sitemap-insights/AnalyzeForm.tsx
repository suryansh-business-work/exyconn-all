import React from 'react';
import { Paper, TextField, Button, CircularProgress, LinearProgress } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Insights, Language } from '@mui/icons-material';

interface AnalyzeFormProps {
  sitemapUrl: string;
  isLoading: boolean;
  onUrlChange: (url: string) => void;
  onAnalyze: () => void;
}

const AnalyzeForm: React.FC<AnalyzeFormProps> = ({
  sitemapUrl,
  isLoading,
  onUrlChange,
  onAnalyze,
}) => (
  <Paper elevation={0} sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
    <Grid container spacing={2} alignItems="center">
      <Grid size={{ xs: 12, md: 8 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="https://example.com/sitemap.xml"
          value={sitemapUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          InputProps={{
            startAdornment: <Language color="action" sx={{ mr: 1 }} />,
          }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={onAnalyze}
          disabled={isLoading || !sitemapUrl.trim()}
          startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <Insights />}
          sx={{ bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' } }}
        >
          {isLoading ? 'Analyzing...' : 'Analyze Sitemap'}
        </Button>
      </Grid>
    </Grid>
    {isLoading && <LinearProgress sx={{ mt: 2 }} color="success" />}
  </Paper>
);

export default AnalyzeForm;
