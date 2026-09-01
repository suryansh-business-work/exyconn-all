import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Chip, Box, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { GppBad } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const BlacklistCheck: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.blacklistCheck, {
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
    <ToolLayout toolName="Domain Blacklist Checker" toolIcon={<GppBad />} toolColor="#ef4444">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<GppBad color="primary" />}
              title="Blacklist Check" buttonText="Check Blacklists" loadingText="Checking blacklists..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`Blacklist Results - ${result.domain}`} icon={<GppBad fontSize="small" />} data={result}>
                <Box sx={{ textAlign: 'center', py: 2, mb: 2 }}>
                  <Typography variant="h4" fontWeight={700}
                    color={result.isClean ? 'success.main' : 'error.main'}>
                    {result.isClean ? 'CLEAN' : 'LISTED'}
                  </Typography>
                  <Chip label={`${result.listedCount}/${result.totalChecked} blacklists`}
                    color={result.isClean ? 'success' : 'error'} sx={{ mt: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>IP: {result.ip as string}</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Blacklist</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(result.results as Array<{ blacklist: string; listed: boolean }>)?.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.blacklist}</TableCell>
                          <TableCell>
                            <Chip size="small" label={r.listed ? 'Listed' : 'Clean'}
                              color={r.listed ? 'error' : 'success'} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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

export default BlacklistCheck;
