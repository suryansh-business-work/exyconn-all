import React, { useState } from 'react';
import { Container, Alert, Snackbar, Typography, Box, Chip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { CalendarToday } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay, KeyValueTable } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const DomainAgeChecker: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.domainAge, {
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

  const age = result?.age as { years: number; months: number; days: number } | null;

  return (
    <ToolLayout toolName="Domain Age Checker" toolIcon={<CalendarToday />} toolColor="#6366f1">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<CalendarToday color="primary" />}
              title="Domain Age Check" buttonText="Check Age" loadingText="Checking..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`Domain Age - ${result.domain}`} icon={<CalendarToday fontSize="small" />} data={result}>
                <Box sx={{ textAlign: 'center', py: 3, mb: 2 }}>
                  {age ? (
                    <>
                      <Typography variant="h3" fontWeight={700} color="primary.main">
                        {age.years}
                      </Typography>
                      <Typography variant="h6" color="text.secondary">years old</Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>{result.ageString as string}</Typography>
                      <Chip label={`${result.totalDays} total days`} sx={{ mt: 1 }} variant="outlined" />
                    </>
                  ) : (
                    <Typography variant="body1" color="text.secondary">{result.message as string}</Typography>
                  )}
                </Box>
                <KeyValueTable data={{
                  Domain: result.domain,
                  'Registration Date': result.registrationDate ? new Date(result.registrationDate as string).toLocaleDateString() : 'N/A',
                  'Total Days': result.totalDays ?? 'N/A',
                  Age: result.ageString ?? 'N/A',
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

export default DomainAgeChecker;
