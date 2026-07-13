import React, { useState } from 'react';
import { Container, Alert, Snackbar, Chip, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Schedule } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay, KeyValueTable } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const DomainExpiryChecker: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.domainExpiry, {
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

  const days = result?.daysUntilExpiry as number | null;

  return (
    <ToolLayout toolName="Domain Expiry Checker" toolIcon={<Schedule />} toolColor="#f59e0b">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<Schedule color="primary" />}
              title="Domain Expiry Check" buttonText="Check Expiry" loadingText="Checking..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`Domain Expiry - ${result.domain}`} icon={<Schedule fontSize="small" />} data={result}>
                {days !== null && (
                  <Box sx={{ mb: 2, textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={700}
                      color={days > 90 ? 'success.main' : days > 30 ? 'warning.main' : 'error.main'}>
                      {days}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">days until expiry</Typography>
                    <Chip label={days > 90 ? 'Safe' : days > 30 ? 'Renew Soon' : 'Critical'}
                      color={days > 90 ? 'success' : days > 30 ? 'warning' : 'error'} sx={{ mt: 1 }} />
                  </Box>
                )}
                <KeyValueTable data={{
                  Domain: result.domain,
                  'Registration Date': result.registrationDate ? new Date(result.registrationDate as string).toLocaleDateString() : 'N/A',
                  'Expiry Date': result.expiryDate ? new Date(result.expiryDate as string).toLocaleDateString() : 'N/A',
                  'Days Until Expiry': days ?? 'N/A',
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

export default DomainExpiryChecker;
