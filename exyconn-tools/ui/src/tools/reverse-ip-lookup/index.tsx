import React, { useState } from 'react';
import { Container, Alert, Snackbar, Chip, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { SwapHoriz } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const ReverseIPLookup: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (ip: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.reverseIP, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Reverse IP lookup failed');
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reverse IP lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="Reverse IP Lookup" toolIcon={<SwapHoriz />} toolColor="#ec4899">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<SwapHoriz color="primary" />}
              title="Reverse IP Lookup" label="IP Address" placeholder="8.8.8.8"
              buttonText="Reverse Lookup" loadingText="Looking up..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`Domains on ${result.ip}`} icon={<SwapHoriz fontSize="small" />} data={result}>
                <Chip label={`${result.count} hostname(s) found`} color="primary" sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {(result.hostnames as string[])?.map((h, i) => (
                    <Chip key={i} label={h} variant="outlined" />
                  ))}
                </Box>
                {Boolean(result.message) && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{result.message as string}</Typography>
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

export default ReverseIPLookup;
