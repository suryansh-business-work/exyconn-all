import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Email } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

interface MXRecord {
  exchange: string;
  priority: number;
}

const MXRecordChecker: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.mxRecords, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'MX record check failed');
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MX record check failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="MX Record Checker" toolIcon={<Email />} toolColor="#0ea5e9">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<Email color="primary" />}
              title="MX Record Lookup" buttonText="Check MX Records" loadingText="Checking..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`MX Records for ${result.domain}`} icon={<Email fontSize="small" />} data={result}>
                <Chip label={`${result.count} record(s) found`} color="primary" sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Mail Server</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(result.records as MXRecord[])?.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell><Chip label={r.priority} size="small" variant="outlined" /></TableCell>
                          <TableCell sx={{ fontFamily: 'monospace' }}>{r.exchange}</TableCell>
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

export default MXRecordChecker;
