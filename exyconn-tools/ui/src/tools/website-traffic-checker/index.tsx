import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Snackbar,
  Paper, LinearProgress, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Insights, Search, Speed, Code, Share, Language, Link } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface TrafficResult {
  domain: string;
  url: string;
  performance: { loadTimeMs: number; pageSizeKB: number; scripts: number; stylesheets: number; images: number; iframes: number };
  content: { title: string; metaDescription: string; wordCount: number; internalPages: number; externalDomains: number };
  social: { platforms: string[]; count: number };
  technology: { detected: string[]; ogType: string };
  links: { internalPages: number; externalDomains: number; externalDomainList: string[] };
}

const MetricCard: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = '#14b8a6' }) => (
  <Paper variant="outlined" sx={{ p: 2, flex: '1 1 120px', textAlign: 'center' }}>
    <Typography variant="h6" fontWeight="bold" color={color}>{value}</Typography>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Paper>
);

const WebsiteTrafficChecker: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<TrafficResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!domain.trim()) return;
    setIsLoading(true); setError(null); setResult(null);
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const res = await fetch(APIs.seoTools.trafficAnalyze, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to analyze');
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally { setIsLoading(false); }
  };

  return (
    <ToolLayout toolName="Website Traffic Checker" toolIcon={<Insights />} toolColor="#14b8a6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                <Search sx={{ mr: 0.5, verticalAlign: 'middle', fontSize: 18 }} />Analyze Website
              </Typography>
              <TextField fullWidth size="small" label="URL" placeholder="https://example.com"
                value={domain} onChange={(e) => setDomain(e.target.value)} sx={{ mb: 2 }}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()} />
              <Button fullWidth variant="contained" onClick={handleCheck}
                disabled={isLoading || !domain.trim()}
                sx={{ textTransform: 'none', bgcolor: '#14b8a6', '&:hover': { bgcolor: '#0d9488' } }}>
                {isLoading ? 'Analyzing...' : 'Analyze Website'}
              </Button>
              <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem' }}>
                Analyzes real page performance, content structure, technology stack,
                social presence, and link profile.
              </Alert>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Speed sx={{ color: '#14b8a6', fontSize: 18 }} /> Performance — {result.domain}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                    <MetricCard label="Load Time" value={`${(result.performance.loadTimeMs / 1000).toFixed(2)}s`} />
                    <MetricCard label="Page Size" value={`${result.performance.pageSizeKB} KB`} />
                    <MetricCard label="Scripts" value={result.performance.scripts} />
                    <MetricCard label="Stylesheets" value={result.performance.stylesheets} />
                    <MetricCard label="Images" value={result.performance.images} />
                    <MetricCard label="iFrames" value={result.performance.iframes} />
                  </Box>
                </Paper>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Code sx={{ color: '#14b8a6', fontSize: 18 }} /> Content & SEO
                  </Typography>
                  {result.content.title && (
                    <Typography variant="body2" sx={{ mb: 0.5 }}><b>Title:</b> {result.content.title}</Typography>
                  )}
                  {result.content.metaDescription && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      <b>Meta:</b> {result.content.metaDescription}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    <Chip label={`Words: ${result.content.wordCount}`} size="small" variant="outlined" />
                    <Chip label={`Internal Pages: ${result.content.internalPages}`} size="small" variant="outlined" />
                    <Chip label={`External Domains: ${result.content.externalDomains}`} size="small" variant="outlined" />
                  </Box>
                </Paper>
                {result.technology.detected.length > 0 && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Language sx={{ color: '#14b8a6', fontSize: 18 }} /> Technology Stack
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {result.technology.detected.map((t) => (
                        <Chip key={t} label={t} size="small" color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </Paper>
                )}
                {result.social.platforms.length > 0 && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Share sx={{ color: '#14b8a6', fontSize: 18 }} /> Social Presence
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {result.social.platforms.map((p) => <Chip key={p} label={p} size="small" variant="outlined" />)}
                    </Box>
                  </Paper>
                )}
                {result.links.externalDomainList.length > 0 && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Link sx={{ color: '#14b8a6', fontSize: 18 }} /> External Domains ({result.links.externalDomains})
                    </Typography>
                    <TableContainer sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead><TableRow><TableCell>#</TableCell><TableCell>Domain</TableCell></TableRow></TableHead>
                        <TableBody>
                          {result.links.externalDomainList.map((d, i) => (
                            <TableRow key={d}><TableCell>{i + 1}</TableCell><TableCell>{d}</TableCell></TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
              </Box>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Insights sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography color="text.secondary">Enter a URL to analyze website performance and technology stack</Typography>
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

export default WebsiteTrafficChecker;
