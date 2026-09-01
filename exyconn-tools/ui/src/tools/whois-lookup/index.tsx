import React, { useState } from 'react';
import { Container, Alert, Snackbar, Typography, Box, Chip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Search } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay, KeyValueTable } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const WhoisLookup: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.whois, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Whois lookup failed');
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Whois lookup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="WHOIS Lookup" toolIcon={<Search />} toolColor="#8b5cf6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<Search color="primary" />}
              title="Whois Lookup" buttonText="Lookup" loadingText="Looking up..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`Whois for ${result.domain}`} icon={<Search fontSize="small" />} data={result}>
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {(result.status as string[])?.map((s, i) => (
                    <Chip key={i} label={s} size="small" variant="outlined" />
                  ))}
                </Box>
                <KeyValueTable data={{
                  Domain: result.domain,
                  Registrar: result.registrar,
                  Registrant: result.registrant,
                }} />
                {Boolean(result.nameservers) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Nameservers</Typography>
                    {(result.nameservers as string[]).map((ns, i) => (
                      <Chip key={i} label={ns} size="small" sx={{ mr: 1, mb: 1 }} variant="outlined" />
                    ))}
                  </Box>
                )}
                {Boolean(result.events) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Events</Typography>
                    {(result.events as Array<{ eventAction: string; eventDate: string }>).map((e, i) => (
                      <Box key={i} sx={{ mb: 0.5 }}>
                        <Chip label={e.eventAction} size="small" color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2" component="span">{new Date(e.eventDate).toLocaleDateString()}</Typography>
                      </Box>
                    ))}
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

export default WhoisLookup;
