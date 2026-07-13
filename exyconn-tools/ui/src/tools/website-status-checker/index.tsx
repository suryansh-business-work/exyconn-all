import React, { useState } from 'react';
import { Container, Alert, Snackbar, Chip, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { MonitorHeart } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay, KeyValueTable } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const WebsiteStatusChecker: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const res = await fetch(APIs.domainTools.websiteStatus, {
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

  return (
    <ToolLayout toolName="Website Status Checker" toolIcon={<MonitorHeart />} toolColor="#22c55e">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<MonitorHeart color="primary" />}
              title="Website Status" label="URL" placeholder="https://example.com"
              buttonText="Check Status" loadingText="Checking..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title="Website Status" icon={<MonitorHeart fontSize="small" />} data={result}>
                <Box sx={{ textAlign: 'center', py: 3, mb: 2 }}>
                  <Typography variant="h2" fontWeight={700}
                    color={result.isUp ? 'success.main' : 'error.main'}>
                    {result.isUp ? 'UP' : 'DOWN'}
                  </Typography>
                  <Chip label={`${result.statusCode} ${result.statusText}`}
                    color={result.isUp ? 'success' : 'error'} sx={{ mt: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Response Time: {String(result.responseTime)}ms
                  </Typography>
                </Box>
                <KeyValueTable data={{
                  URL: result.url,
                  'Status Code': result.statusCode,
                  'Response Time': `${result.responseTime}ms`,
                  Server: result.server,
                  'Content Type': result.contentType,
                }} />
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

export default WebsiteStatusChecker;
