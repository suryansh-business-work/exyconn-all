import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Paper, Box, Typography, TextField, Button, MenuItem, CircularProgress,
  Chip, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Dns, Send, ExpandMore } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { DomainResultDisplay } from '../../shared/components/DomainToolShared';
import { APIs } from '../../shared/config/apis';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const DNS_TYPES = ['ALL', 'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV'];

const DNSLookup: React.FC = () => {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: { domain: '', type: 'ALL' },
    validationSchema: Yup.object({
      domain: Yup.string().required('Domain is required'),
      type: Yup.string().required(),
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(APIs.domainTools.dnsLookup, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'DNS lookup failed');
        setResult(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'DNS lookup failed');
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <ToolLayout toolName="DNS Lookup" toolIcon={<Dns />} toolColor="#6366f1">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Dns color="primary" />
                <Typography variant="h6" fontWeight={600}>DNS Lookup</Typography>
              </Box>
              <form onSubmit={formik.handleSubmit}>
                <TextField fullWidth name="domain" label="Domain" placeholder="example.com"
                  value={formik.values.domain} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.domain && Boolean(formik.errors.domain)}
                  helperText={formik.touched.domain && formik.errors.domain} sx={{ mb: 2 }} />
                <TextField fullWidth select name="type" label="Record Type" value={formik.values.type}
                  onChange={formik.handleChange} sx={{ mb: 3 }}>
                  {DNS_TYPES.map((t) => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
                </TextField>
                <Button type="submit" variant="contained" fullWidth disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={18} /> : <Send />} sx={{ py: 1.25 }}>
                  {isLoading ? 'Looking up...' : 'Lookup DNS'}
                </Button>
              </form>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <DomainResultDisplay title={`DNS Records for ${result.domain}`} icon={<Dns fontSize="small" />} data={result}>
                {Object.entries(result)
                  .filter(([key]) => key !== 'domain')
                  .map(([key, value]) => (
                    <Accordion key={key} defaultExpanded>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Chip label={key} color="primary" size="small" sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          {Array.isArray(value) ? `${(value as unknown[]).length} record(s)` : '1 record'}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 12 }}>
                          {JSON.stringify(value, null, 2)}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
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

export default DNSLookup;
