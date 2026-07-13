import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Chip, Box, Typography,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { TextSnippet, ExpandMore } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainInputForm, DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';

const TXTRecordChecker: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.domainTools.txtRecords, {
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
    <ToolLayout toolName="TXT Record Checker" toolIcon={<TextSnippet />} toolColor="#84cc16">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <DomainInputForm onSubmit={handleCheck} isLoading={isLoading} icon={<TextSnippet color="primary" />}
              title="TXT Record Check" buttonText="Check TXT Records" loadingText="Checking..." />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`TXT Records - ${result.domain}`} icon={<TextSnippet fontSize="small" />} data={result}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Chip label="SPF" color="primary" size="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">{(result.spf as string[])?.length || 0} record(s)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {(result.spf as string[])?.map((r, i) => (
                      <Typography key={i} variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, mb: 1, wordBreak: 'break-all' }}>{r}</Typography>
                    ))}
                    {!(result.spf as string[])?.length && <Typography variant="body2" color="text.secondary">No SPF records found</Typography>}
                  </AccordionDetails>
                </Accordion>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Chip label="DKIM" color="secondary" size="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">{(result.dkim as unknown[])?.length || 0} record(s)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {(result.dkim as Array<{ selector: string; record: string[] }>)?.map((d, i) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        <Chip label={d.selector} size="small" variant="outlined" sx={{ mr: 1 }} />
                        {d.record.map((r, j) => (
                          <Typography key={j} variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, mt: 0.5, wordBreak: 'break-all' }}>{r}</Typography>
                        ))}
                      </Box>
                    ))}
                    {!(result.dkim as unknown[])?.length && <Typography variant="body2" color="text.secondary">No DKIM records found</Typography>}
                  </AccordionDetails>
                </Accordion>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Chip label="DMARC" color="warning" size="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">{(result.dmarc as string[])?.length || 0} record(s)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {(result.dmarc as string[])?.map((r, i) => (
                      <Typography key={i} variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, mb: 1, wordBreak: 'break-all' }}>{r}</Typography>
                    ))}
                    {!(result.dmarc as string[])?.length && <Typography variant="body2" color="text.secondary">No DMARC records found</Typography>}
                  </AccordionDetails>
                </Accordion>
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Chip label="All TXT" size="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">{(result.txtRecords as string[])?.length || 0} total record(s)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {(result.txtRecords as string[])?.map((r, i) => (
                      <Typography key={i} variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1, wordBreak: 'break-all' }}>{r}</Typography>
                    ))}
                  </AccordionDetails>
                </Accordion>
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

export default TXTRecordChecker;
