import React, { useState } from 'react';
import { Container, Alert, Snackbar, Chip, Typography, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Lock } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay, KeyValueTable } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const SSLChecker: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.sslCheck, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'SSL check failed');
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'SSL check failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="SSL Certificate Checker" toolIcon={<Lock />} toolColor="#22c55e">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<Lock color="primary" />}
              title="SSL Certificate Check" buttonText="Check SSL" loadingText="Checking SSL..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title="SSL Certificate Details" icon={<Lock fontSize="small" color="success" />} data={result}>
                <Box sx={{ mb: 2 }}>
                  <Chip label={result.valid ? 'Valid' : 'Invalid'} color={result.valid ? 'success' : 'error'} sx={{ mr: 1 }} />
                  <Chip label={`${result.daysRemaining} days remaining`}
                    color={Number(result.daysRemaining) > 30 ? 'success' : Number(result.daysRemaining) > 7 ? 'warning' : 'error'} />
                </Box>
                <KeyValueTable data={result} excludeKeys={['subjectAltNames', 'subject', 'issuer']} />
                {Boolean(result.subject) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Subject</Typography>
                    <KeyValueTable data={result.subject as Record<string, unknown>} />
                  </Box>
                )}
                {Boolean(result.issuer) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Issuer</Typography>
                    <KeyValueTable data={result.issuer as Record<string, unknown>} />
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

export default SSLChecker;
