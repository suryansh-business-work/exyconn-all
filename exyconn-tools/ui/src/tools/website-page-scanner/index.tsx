import React, { useState } from 'react';
import { Container, Alert, Snackbar, Paper, Box, Typography, Stack } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Scanner } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import { ScanResult } from './types';
import ScannerInputSection from './ScannerInputSection';
import PageCard from './PageCard';

const WebsitePageScanner: React.FC = () => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [maxPages, setMaxPages] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    if (!websiteUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(APIs.websiteTools.scanPages, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl, maxPages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to scan pages');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan pages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page-scan-results.json';
    a.click();
  };

  return (
    <ToolLayout toolName="Website Page Scanner" toolIcon={<Scanner />} toolColor="#8b5cf6">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <ScannerInputSection
              websiteUrl={websiteUrl}
              maxPages={maxPages}
              isLoading={isLoading}
              result={result}
              onUrlChange={setWebsiteUrl}
              onMaxPagesChange={setMaxPages}
              onScan={handleScan}
              onExportJSON={handleExportJSON}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, minHeight: 480 }}>
              {!result ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <Scanner sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                  <Typography variant="body1">Enter a website URL and click Scan to analyze pages</Typography>
                </Box>
              ) : (
                <Box sx={{ maxHeight: 500, overflow: 'auto', p: 2 }}>
                  <Stack spacing={1.5}>
                    {result.pages.map((page) => (
                      <PageCard
                        key={page.url}
                        page={page}
                        isExpanded={expandedPage === page.url}
                        onToggle={() => setExpandedPage(expandedPage === page.url ? null : page.url)}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default WebsitePageScanner;
