import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Storage } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const NameserverChecker: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.nameservers, {
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
    <ToolLayout toolName="Nameserver Checker" toolIcon={<Storage />} toolColor="#14b8a6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<Storage color="primary" />}
              title="Nameserver Check" buttonText="Check NS" loadingText="Checking..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`Nameservers for ${result.domain}`} icon={<Storage fontSize="small" />} data={result}>
                <Chip label={`${result.count} nameserver(s)`} color="primary" sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Nameserver</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>IP Addresses</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(result.nameservers as Array<{ nameserver: string; ips: string[] }>)?.map((ns, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{ns.nameserver}</TableCell>
                          <TableCell>{ns.ips.map((ip, j) => (
                            <Chip key={j} label={ip} size="small" sx={{ mr: 0.5, mb: 0.5 }} variant="outlined" />
                          ))}</TableCell>
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

export default NameserverChecker;
