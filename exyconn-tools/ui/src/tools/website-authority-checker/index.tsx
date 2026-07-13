import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Snackbar,
  Paper, LinearProgress, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Leaderboard, Search, TrendingUp } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface AuthorityResult {
  domain: string;
  score: number;
  metrics: { label: string; value: string }[];
  tips: string[];
}

const WebsiteAuthorityChecker: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<AuthorityResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!domain.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(APIs.seoTools.seoCheck, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: domain.startsWith('http') ? domain : `https://${domain}` }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to check authority');
      const d = data.data;
      setResult({
        domain: d.url,
        score: d.score,
        metrics: [
          { label: 'SEO Score', value: `${d.score}/100` },
          { label: 'Word Count', value: String(d.wordCount) },
          { label: 'Internal Links', value: String(d.links.internal) },
          { label: 'External Links', value: String(d.links.external) },
          { label: 'Images', value: String(d.images.total) },
          { label: 'Schema Types', value: String(d.schemaMarkup.length) },
        ],
        tips: d.issues.map((i: { message: string }) => i.message),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (s: number) => (s >= 80 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444');

  return (
    <ToolLayout toolName="Website Authority Checker" toolIcon={<Leaderboard />} toolColor="#3b82f6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom><Search sx={{ mr: 1, verticalAlign: 'middle' }} />Check Domain Authority</Typography>
              <TextField fullWidth size="small" label="Domain" placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)} sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" onClick={handleCheck} disabled={isLoading || !domain.trim()} sx={{ textTransform: 'none', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
                {isLoading ? 'Analyzing...' : 'Check Authority'}
              </Button>
              <Alert severity="info" sx={{ mt: 2 }}>This tool analyzes on-page SEO factors to estimate domain quality. For full authority scores (DA/DR), consider using Moz or Ahrefs.</Alert>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {result && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                  <TrendingUp sx={{ fontSize: 32, color: getScoreColor(result.score) }} />
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color={getScoreColor(result.score)}>{result.score}/100</Typography>
                    <Typography variant="body2" color="text.secondary">{result.domain}</Typography>
                  </Box>
                </Box>
                <LinearProgress variant="determinate" value={result.score} sx={{ height: 10, borderRadius: 5, mb: 3, '& .MuiLinearProgress-bar': { bgcolor: getScoreColor(result.score) } }} />
                <Typography variant="subtitle2" gutterBottom>Key Metrics</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {result.metrics.map((m) => (
                    <Chip key={m.label} label={`${m.label}: ${m.value}`} variant="outlined" size="small" />
                  ))}
                </Box>
                {result.tips.length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>Improvement Tips</Typography>
                    {result.tips.slice(0, 8).map((tip, i) => (
                      <Alert key={i} severity="warning" sx={{ mb: 1, py: 0 }}>{tip}</Alert>
                    ))}
                  </>
                )}
              </Paper>
            )}
            {!result && !isLoading && (
              <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                <Leaderboard sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography color="text.secondary">Enter a domain to check its authority</Typography>
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

export default WebsiteAuthorityChecker;
