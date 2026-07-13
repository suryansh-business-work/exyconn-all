import React, { useState } from 'react';
import { Container, Alert, Snackbar, Chip, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Timer } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay, KeyValueTable } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const SSLExpiryMonitor: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.sslExpiry, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
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

  const statusColor = (s: string) => s === 'valid' ? 'success' : s === 'warning' ? 'warning' : 'error';

  return (
    <ToolLayout toolName="SSL Expiry Monitor" toolIcon={<Timer />} toolColor="#f97316">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<Timer color="primary" />}
              title="SSL Expiry Monitor" buttonText="Check SSL Expiry" loadingText="Checking..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`SSL Expiry - ${result.domain}`} icon={<Timer fontSize="small" />} data={result}>
                <Box sx={{ textAlign: 'center', py: 3, mb: 2 }}>
                  <Typography variant="h3" fontWeight={700}
                    color={`${statusColor(result.status as string)}.main`}>
                    {result.daysRemaining as number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">days until SSL expiry</Typography>
                  <Chip label={(result.status as string).toUpperCase()} sx={{ mt: 1 }}
                    color={statusColor(result.status as string)} />
                </Box>
                <KeyValueTable data={{
                  Domain: result.domain,
                  'Valid From': result.validFrom,
                  'Valid To': result.validTo,
                  'Days Remaining': result.daysRemaining,
                  Status: result.status,
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

export default SSLExpiryMonitor;
