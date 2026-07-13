import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Chip, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AccountTree } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const SubdomainFinder: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.subdomains, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Search failed');
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="Subdomain Finder" toolIcon={<AccountTree />} toolColor="#8b5cf6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<AccountTree color="primary" />}
              title="Find Subdomains" buttonText="Find Subdomains" loadingText="Scanning..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {isLoading && <LinearProgress sx={{ mb: 2 }} />}
            {result && (
              <DomainResultDisplay title={`Subdomains of ${result.domain}`} icon={<AccountTree fontSize="small" />} data={result}>
                <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                  <Chip label={`${result.totalFound} found`} color="primary" />
                  <Chip label={`${result.totalChecked} checked`} variant="outlined" />
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Subdomain</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>IP Addresses</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(result.subdomains as Array<{ subdomain: string; ips: string[] }>)?.map((s, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{s.subdomain}</TableCell>
                          <TableCell>
                            {s.ips.map((ip, j) => (
                              <Chip key={j} label={ip} size="small" sx={{ mr: 0.5, mb: 0.5 }} variant="outlined" />
                            ))}
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

export default SubdomainFinder;
