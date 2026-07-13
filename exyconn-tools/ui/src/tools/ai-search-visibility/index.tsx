import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Snackbar,
  Paper, LinearProgress, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Visibility, Search } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface VisibilityResult {
  title: string;
  description: string;
  score: number;
  hasStructuredData: boolean;
  headings: { h1: number; h2: number };
  wordCount: number;
  links: { internal: number; external: number };
}

const tips = [
  'Create comprehensive, authoritative content about your brand and industry',
  'Add structured data (Schema.org) to help AI models understand your content',
  'Ensure your brand is mentioned consistently across reputable sources',
  'Build a Wikipedia or Wikidata presence for brand recognition',
  'Maintain an active blog with well-structured, long-form content',
  'Use clear headings (H1, H2, H3) to organize information logically',
  'Include FAQ sections — AI models often pull from Q&A formatted content',
];

const AISearchVisibility: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<VisibilityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!domain.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const res = await fetch(APIs.seoTools.seoCheck, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to analyze');
      const d = data.data;
      setResult({
        title: d.title || '', description: d.metaDescription || '',
        score: d.score || 0, hasStructuredData: d.structuredData?.length > 0 || false,
        headings: { h1: d.headings?.h1 || 0, h2: d.headings?.h2 || 0 },
        wordCount: d.content?.wordCount || 0,
        links: { internal: d.links?.internal || 0, external: d.links?.external || 0 },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="AI Search Visibility" toolIcon={<Visibility />} toolColor="#8b5cf6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom><Search sx={{ mr: 1, verticalAlign: 'middle' }} />Check AI Visibility</Typography>
              <TextField fullWidth size="small" label="Website URL" placeholder="https://yourbrand.com" value={domain} onChange={(e) => setDomain(e.target.value)} sx={{ mb: 2 }} onKeyDown={(e) => e.key === 'Enter' && handleCheck()} />
              <Button fullWidth variant="contained" onClick={handleCheck} disabled={isLoading || !domain.trim()} sx={{ textTransform: 'none', bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>
                {isLoading ? 'Analyzing...' : 'Check Visibility'}
              </Button>
              <Alert severity="info" sx={{ mt: 2 }}>
                Analyzes your website&apos;s content structure and SEO factors that influence visibility in AI search engines like ChatGPT, Perplexity, and Gemini.
              </Alert>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {result && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>AI Readiness Analysis</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 100px', textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight="bold" color={result.score >= 70 ? '#22c55e' : result.score >= 40 ? '#f59e0b' : '#ef4444'}>
                        {result.score}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">SEO Score</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 100px', textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="bold" color={result.wordCount > 300 ? '#22c55e' : '#f59e0b'}>
                        {result.wordCount}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Word Count</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, flex: '1 1 100px', textAlign: 'center' }}>
                      <Chip label={result.hasStructuredData ? 'Yes' : 'No'} color={result.hasStructuredData ? 'success' : 'error'} size="small" />
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Structured Data</Typography>
                    </Paper>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label={`H1: ${result.headings.h1}`} variant="outlined" size="small" />
                    <Chip label={`H2: ${result.headings.h2}`} variant="outlined" size="small" />
                    <Chip label={`Internal Links: ${result.links.internal}`} variant="outlined" size="small" />
                    <Chip label={`External Links: ${result.links.external}`} variant="outlined" size="small" />
                  </Box>
                </Paper>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Tips to Improve AI Visibility</Typography>
                  {tips.map((tip, i) => (
                    <Alert key={i} severity="info" sx={{ mb: 1, py: 0 }}>{tip}</Alert>
                  ))}
                </Paper>
              </Box>
            )}
            {!result && !isLoading && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Visibility sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography color="text.secondary">Enter your website URL to check AI search visibility</Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
        <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
};

export default AISearchVisibility;
