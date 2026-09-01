import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Chip, Box, Typography,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { SettingsEthernet } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const HTTPHeadersCheck: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const res = await fetch(APIs.domainTools.httpHeaders, {
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

  return (
    <ToolLayout toolName="HTTP Headers Checker" toolIcon={<SettingsEthernet />} toolColor="#0ea5e9">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<SettingsEthernet color="primary" />}
              title="HTTP Headers Check" label="URL" placeholder="https://example.com"
              buttonText="Check Headers" loadingText="Checking..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title="HTTP Headers" icon={<SettingsEthernet fontSize="small" />} data={result}>
                <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`Status: ${result.statusCode}`} color={Number(result.statusCode) < 400 ? 'success' : 'error'} />
                  <Chip label={`Server: ${result.server}`} variant="outlined" />
                </Box>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Security Headers</Typography>
                <TableContainer sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Header</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(result.securityHeaders as Record<string, string>).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{key}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, maxWidth: 300, wordBreak: 'break-all' }}>{value}</TableCell>
                          <TableCell>
                            <Chip size="small" label={value === 'Not set' ? 'Missing' : 'Set'}
                              color={value === 'Not set' ? 'error' : 'success'} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>All Response Headers</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      {Object.entries(result.headers as Record<string, string>).map(([key, value]) => (
                        <TableRow key={key}>
                          <TableCell sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: 12 }}>{key}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{String(value)}</TableCell>
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

export default HTTPHeadersCheck;
