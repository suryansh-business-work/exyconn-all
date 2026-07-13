import React, { useState } from 'react';
import { Container, Alert, Snackbar, Typography, Box, Chip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { DomainVerification } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const DomainAvailability: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.domainAvailability, {
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

  return (
    <ToolLayout toolName="Domain Availability" toolIcon={<DomainVerification />} toolColor="#3b82f6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<DomainVerification color="primary" />}
              title="Check Domain Availability" buttonText="Check Availability" loadingText="Checking..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`${result.domain}`} icon={<DomainVerification fontSize="small" />} data={result}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h4" fontWeight={700}
                    color={result.available ? 'success.main' : 'error.main'}>
                    {result.available ? 'Available!' : 'Taken'}
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{result.domain as string}</Typography>
                  <Chip label={result.message as string} size="medium"
                    color={result.available ? 'success' : 'info'} />
                  {!result.available && (result.ips as string[])?.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">Resolves to:</Typography>
                      {(result.ips as string[]).map((ip, i) => (
                        <Chip key={i} label={ip} size="small" variant="outlined" sx={{ m: 0.5 }} />
                      ))}
                    </Box>
                  )}
                </Box>
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

export default DomainAvailability;
