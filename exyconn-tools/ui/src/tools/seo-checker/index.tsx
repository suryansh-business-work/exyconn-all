import React, { useState } from 'react';
import {
  Container, Typography, TextField, Button, Alert, Snackbar,
  Paper, LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { FindInPage } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import { SEOResult } from './types';
import SeoResultDisplay from './SeoResultDisplay';

const SEOChecker: React.FC = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<SEOResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      let targetUrl = url.trim();
      if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;
      const res = await fetch(APIs.seoTools.seoCheck, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'SEO check failed');
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SEO check failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="SEO Checker" toolIcon={<FindInPage />} toolColor="#22c55e">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: '1rem' }}>
                Analyze Website SEO
              </Typography>
              <TextField
                fullWidth size="small" label="Website URL" placeholder="https://example.com"
                value={url} onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth variant="contained" onClick={handleCheck}
                disabled={isLoading || !url.trim()}
                startIcon={<FindInPage />}
                sx={{ textTransform: 'none' }}
              >
                {isLoading ? 'Analyzing...' : 'Check SEO'}
              </Button>
              {isLoading && <LinearProgress sx={{ mt: 2 }} />}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            {result && <SeoResultDisplay result={result} />}
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default SEOChecker;
