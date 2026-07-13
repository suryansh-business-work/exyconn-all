import React, { useState } from 'react';
import { Box, Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Map } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import SitemapForm from './components/SitemapForm';
import SitemapResults from './components/SitemapResults';
import ExportButtons from './components/ExportButtons';
import { SitemapFormValues, SitemapResult } from './types';
import APIs from '../../shared/config/apis';

const SitemapFinder: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SitemapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFindSitemaps = async (values: SitemapFormValues) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${APIs.baseUrl}/tools/sitemap-finder/find`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to find sitemaps');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="Sitemap Finder Pro" toolIcon={<Map />} toolColor="#ef4444">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Left Panel - Form */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <SitemapForm onSubmit={handleFindSitemaps} isLoading={isLoading} />
              {result && result.sitemapsFound.length > 0 && <ExportButtons result={result} />}
            </Box>
          </Grid>

          {/* Right Panel - Results */}
          <Grid size={{ xs: 12, md: 8 }}>
            {result ? (
              <SitemapResults result={result} />
            ) : (
              <Box
                sx={{
                  height: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 2,
                  borderStyle: 'dashed',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                }}
              >
                <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  <Map sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                  <Box sx={{ mb: 1 }}>Enter a website URL to discover all sitemaps</Box>
                  <Box sx={{ fontSize: 14, opacity: 0.7 }}>
                    We'll check robots.txt, common locations, and sitemap indexes
                  </Box>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default SitemapFinder;
