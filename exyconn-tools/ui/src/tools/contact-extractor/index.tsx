import React, { useState } from 'react';
import { Box, Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ContactMail } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import ExtractForm from './components/ExtractForm';
import ResultsSummary from './components/ResultsSummary';
import PageDetails from './components/PageDetails';
import ExportButtons from './components/ExportButtons';
import { ExtractFormValues, ExtractionResult, ExtractionMode } from './types';
import APIs from '../../shared/config/apis';

const ContactExtractor: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<ExtractionMode | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async (values: ExtractFormValues, mode: ExtractionMode) => {
    setIsLoading(true);
    setLoadingMode(mode);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${APIs.baseUrl}/tools/contact-extractor/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, mode }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract contacts');
      }

      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setLoadingMode(null);
    }
  };

  return (
    <ToolLayout toolName="Contact Extractor" toolIcon={<ContactMail />} toolColor="#8b5cf6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Left Panel - Form */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <ExtractForm onSubmit={handleExtract} isLoading={isLoading} loadingMode={loadingMode} />
              {result && <ExportButtons result={result} />}
            </Box>
          </Grid>

          {/* Right Panel - Results */}
          <Grid size={{ xs: 12, md: 8 }}>
            {result ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <ResultsSummary result={result} />
                <PageDetails pages={result.pages} />
              </Box>
            ) : (
              <Box
                sx={{
                  height: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 2,
                  borderStyle: 'dashed',
                  borderColor: 'divider',
                  bgcolor: 'grey.50',
                }}
              >
                <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                  <ContactMail sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
                  <Box>Enter a URL and choose an extraction type to begin</Box>
                </Box>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default ContactExtractor;
