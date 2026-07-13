import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Snackbar,
  Paper, LinearProgress, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { TrendingUp, Search, Info } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface SeoResult {
  title: string;
  description: string;
  score: number;
  headings: { h1: number; h2: number; h3: number };
  links: { internal: number; external: number };
  loadTime: number;
}

const KeywordRankChecker: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<SeoResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!domain.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const res = await fetch(APIs.seoTools.seoCheck, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to analyze');
      const d = data.data;
      setResult({
        title: d.title || '', description: d.metaDescription || '',
        score: d.score || 0, headings: d.headings || { h1: 0, h2: 0, h3: 0 },
        links: { internal: d.links?.internal || 0, external: d.links?.external || 0 },
        loadTime: d.performance?.loadTime || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="Keyword Rank Checker" toolIcon={<TrendingUp />} toolColor="#ef4444">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom><Search sx={{ mr: 1, verticalAlign: 'middle' }} />Rank Analysis</Typography>
              <TextField fullWidth size="small" label="Website URL" placeholder="https://example.com" value={domain} onChange={(e) => setDomain(e.target.value)} sx={{ mb: 2 }} onKeyDown={(e) => e.key === 'Enter' && handleCheck()} />
              <Button fullWidth variant="contained" onClick={handleCheck} disabled={isLoading || !domain.trim()} sx={{ textTransform: 'none', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
                {isLoading ? 'Analyzing...' : 'Analyze SEO'}
              </Button>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Actual keyword position tracking requires Google Search Console API. This tool analyzes your site&apos;s SEO health which directly impacts rankings.
              </Alert>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {result && (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Info sx={{ color: '#ef4444' }} />
                  <Typography variant="h6">SEO Health Analysis</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  <Paper variant="outlined" sx={{ p: 2, flex: '1 1 120px', textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color={result.score >= 70 ? '#22c55e' : result.score >= 40 ? '#f59e0b' : '#ef4444'}>
                      {result.score}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">SEO Score</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, flex: '1 1 120px', textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" color="#0ea5e9">{result.links.internal}</Typography>
                    <Typography variant="caption" color="text.secondary">Internal Links</Typography>
                  </Paper>
                  <Paper variant="outlined" sx={{ p: 2, flex: '1 1 120px', textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" color="#8b5cf6">{result.links.external}</Typography>
                    <Typography variant="caption" color="text.secondary">External Links</Typography>
                  </Paper>
                </Box>
                {result.title && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Page Title</Typography>
                    <Typography variant="body1">{result.title}</Typography>
                  </Box>
                )}
                {result.description && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">Meta Description</Typography>
                    <Typography variant="body2">{result.description}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label={`H1: ${result.headings.h1}`} size="small" variant="outlined" />
                  <Chip label={`H2: ${result.headings.h2}`} size="small" variant="outlined" />
                  <Chip label={`H3: ${result.headings.h3}`} size="small" variant="outlined" />
                  {result.loadTime > 0 && (
                    <Chip label={`Load: ${(result.loadTime / 1000).toFixed(2)}s`} size="small" color={result.loadTime < 3000 ? 'success' : 'warning'} />
                  )}
                </Box>
              </Paper>
            )}
            {!result && !isLoading && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography color="text.secondary">Enter a URL to analyze its SEO health and ranking potential</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
        <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
};

export default KeywordRankChecker;
