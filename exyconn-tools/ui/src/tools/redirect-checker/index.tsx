import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Chip, Box, Typography,
  Stepper, Step, StepLabel,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Directions } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const RedirectChecker: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const res = await fetch(APIs.domainTools.redirectCheck, {
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

  const chain = (result?.chain as Array<{ url: string; statusCode: number; location: string }>) || [];

  return (
    <ToolLayout toolName="Redirect Checker" toolIcon={<Directions />} toolColor="#f59e0b">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<Directions color="primary" />}
              title="Redirect Checker" label="URL" placeholder="https://example.com"
              buttonText="Check Redirects" loadingText="Checking..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title="Redirect Chain" icon={<Directions fontSize="small" />} data={result}>
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={result.hasRedirects ? `${result.totalRedirects} redirect(s)` : 'No redirects'}
                    color={result.hasRedirects ? 'warning' : 'success'} />
                  <Chip label={`Final: ${result.finalUrl}`} variant="outlined" sx={{ maxWidth: 300 }} />
                </Box>
                <Stepper orientation="vertical" activeStep={chain.length - 1}>
                  {chain.map((step, i) => (
                    <Step key={i} completed>
                      <StepLabel>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={step.statusCode || 'Error'} size="small"
                            color={step.statusCode >= 300 && step.statusCode < 400 ? 'warning' : step.statusCode >= 200 && step.statusCode < 300 ? 'success' : 'error'} />
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>
                            {step.url}
                          </Typography>
                        </Box>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
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

export default RedirectChecker;
