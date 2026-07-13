import React, { useState } from 'react';
import { Container, Alert, Snackbar, Chip, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Speed } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay, KeyValueTable } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const PageSpeedChecker: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const res = await fetch(APIs.domainTools.pageSpeed, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fullUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Check failed');
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setIsLoading(false);
    }
  };

  const perf = result?.performance as Record<string, unknown> | undefined;
  const resources = result?.resources as Record<string, number> | undefined;

  return (
    <ToolLayout toolName="Page Speed Checker" toolIcon={<Speed />} toolColor="#f59e0b">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<Speed color="primary" />}
              title="Page Speed Check" label="URL" placeholder="https://example.com"
              buttonText="Check Speed" loadingText="Analyzing..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title="Page Speed Results" icon={<Speed fontSize="small" />} data={result}>
                <Box sx={{ textAlign: 'center', py: 2, mb: 2 }}>
                  <Typography variant="h3" fontWeight={700}
                    color={perf?.rating === 'Fast' ? 'success.main' : perf?.rating === 'Average' ? 'warning.main' : 'error.main'}>
                    {String(result.loadTime)}ms
                  </Typography>
                  <Chip label={perf?.rating as string} sx={{ mt: 1 }}
                    color={perf?.rating === 'Fast' ? 'success' : perf?.rating === 'Average' ? 'warning' : 'error'} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Page Size: {result.pageSizeFormatted as string}
                  </Typography>
                </Box>
                {resources && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Resource Count</Typography>
                    <KeyValueTable data={{
                      Scripts: resources.scripts,
                      Stylesheets: resources.stylesheets,
                      Images: resources.images,
                      'Inline Styles': resources.inlineStyles,
                    }} />
                  </Box>
                )}
              </DomainResultDisplay>
            )}
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default PageSpeedChecker;
