import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Chip, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { LockOpen } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const OpenPortsCheck: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (host: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.openPorts, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host }),
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
    <ToolLayout toolName="Open Port Checker" toolIcon={<LockOpen />} toolColor="#ef4444">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<LockOpen color="primary" />}
              title="Open Ports Scanner" label="Host" placeholder="example.com"
              buttonText="Scan Ports" loadingText="Scanning ports..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`Port Scan - ${result.host}`} icon={<LockOpen fontSize="small" />} data={result}>
                <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <Chip label={`${result.openCount} open`} color="warning" />
                  <Chip label={`${result.totalChecked} scanned`} variant="outlined" />
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Port</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(result.results as Array<{ port: number; service: string; status: string }>)?.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.port}</TableCell>
                          <TableCell>{r.service}</TableCell>
                          <TableCell>
                            <Chip size="small" label={r.status}
                              color={r.status === 'open' ? 'success' : r.status === 'filtered' ? 'warning' : 'default'} />
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

export default OpenPortsCheck;
