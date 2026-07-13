import React, { useState } from 'react';
import { Container, Alert, Snackbar, Paper, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { CheckCircle } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import { ValidationResult } from './types';
import ValidatorForm from './ValidatorForm';
import ValidationSummary from './ValidationSummary';
import IssuesPanel from './IssuesPanel';

const SitemapValidator: React.FC = () => {
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!sitemapUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(APIs.sitemapTools.validate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sitemapUrl }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Validation failed');
      setResult(data as unknown as ValidationResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const errors = result?.issues.filter((i) => i.type === 'error') || [];
  const warnings = result?.issues.filter((i) => i.type === 'warning') || [];

  return (
    <ToolLayout toolName="XML Sitemap Validator" toolIcon={<CheckCircle />} toolColor="#22c55e">
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <ValidatorForm
              sitemapUrl={sitemapUrl}
              isLoading={isLoading}
              onUrlChange={setSitemapUrl}
              onValidate={handleValidate}
            />
            {result && (
              <ValidationSummary result={result} errorCount={errors.length} warningCount={warnings.length} />
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, minHeight: 400 }}>
              {!result ? (
                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <CheckCircle sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
                  <Typography variant="body1">Enter a sitemap URL to validate</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Checks XML syntax, URL format, lastmod, changefreq, priority, and size limits
                  </Typography>
                </Box>
              ) : (
                <IssuesPanel result={result} errors={errors} warnings={warnings} />
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default SitemapValidator;
