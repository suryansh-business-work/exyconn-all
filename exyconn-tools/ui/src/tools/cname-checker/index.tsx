import React, { useState } from 'react';
import { Container, Alert, Snackbar, Chip, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { CompareArrows } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const CNAMEChecker: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.cnameCheck, {
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
    <ToolLayout toolName="CNAME Checker" toolIcon={<CompareArrows />} toolColor="#0ea5e9">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<CompareArrows color="primary" />}
              title="CNAME Record Check" placeholder="subdomain.example.com"
              buttonText="Check CNAME" loadingText="Checking..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`CNAME - ${result.domain}`} icon={<CompareArrows fontSize="small" />} data={result}>
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Chip label={result.hasCNAME ? 'CNAME Found' : 'No CNAME'} size="medium"
                    color={result.hasCNAME ? 'success' : 'warning'} sx={{ mb: 2 }} />
                  {(result.records as string[])?.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>CNAME Records</Typography>
                      {(result.records as string[]).map((r, i) => (
                        <Chip key={i} label={r} sx={{ m: 0.5 }} variant="outlined" />
                      ))}
                    </Box>
                  )}
                  {Boolean(result.message) && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{result.message as string}</Typography>
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

export default CNAMEChecker;
