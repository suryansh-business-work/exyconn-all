import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Snackbar,
  Paper, LinearProgress, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Biotech, Search, OpenInNew, ContentCopy } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface RelatedSite { domain: string; mentions: number; anchors: string[] }
interface CompetitorResult {
  analyzedDomain: string;
  siteContext: { title: string; description: string; technologies: string[] };
  relatedSites: RelatedSite[];
  totalExternalDomains: number;
}

const CompetitorFinder: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFind = async () => {
    if (!domain.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const res = await fetch(APIs.seoTools.competitorAnalyze, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to analyze');
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const text = result.relatedSites.map((r) => r.domain).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout toolName="Competitor Finder" toolIcon={<Biotech />} toolColor="#8b5cf6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom><Search sx={{ mr: 1, verticalAlign: 'middle' }} />Find Related Sites</Typography>
              <TextField fullWidth size="small" label="Website URL" placeholder="https://yourdomain.com" value={domain} onChange={(e) => setDomain(e.target.value)} sx={{ mb: 2 }} onKeyDown={(e) => e.key === 'Enter' && handleFind()} />
              <Button fullWidth variant="contained" onClick={handleFind} disabled={isLoading || !domain.trim()} sx={{ textTransform: 'none', bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}>
                {isLoading ? 'Analyzing...' : 'Find Related Sites'}
              </Button>
              <Alert severity="info" sx={{ mt: 2 }}>Discovers related sites by analyzing external links on your website. Sites linked frequently are likely industry-related.</Alert>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{result.relatedSites.length} Related Sites Found</Typography>
                  {result.relatedSites.length > 0 && (
                    <Button size="small" startIcon={<ContentCopy />} onClick={handleCopy} sx={{ textTransform: 'none' }}>
                      {copied ? 'Copied!' : 'Copy Domains'}
                    </Button>
                  )}
                </Box>
                {result.siteContext.title && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <strong>{result.siteContext.title}</strong>
                    {result.siteContext.description && <Typography variant="body2">{result.siteContext.description}</Typography>}
                    {result.siteContext.technologies.length > 0 && (
                      <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {result.siteContext.technologies.map((t) => <Chip key={t} label={t} size="small" />)}
                      </Box>
                    )}
                  </Alert>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Total external domains found: {result.totalExternalDomains}
                </Typography>
                {result.relatedSites.length > 0 ? (
                  <TableContainer sx={{ maxHeight: 500 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Domain</TableCell>
                          <TableCell align="center">Mentions</TableCell>
                          <TableCell>Link Anchors</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.relatedSites.map((r, i) => (
                          <TableRow key={i} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2">{r.domain}</Typography>
                                <OpenInNew sx={{ fontSize: 14, color: 'action.disabled', cursor: 'pointer' }} onClick={() => window.open(`https://${r.domain}`, '_blank')} />
                              </Box>
                            </TableCell>
                            <TableCell align="center"><Chip label={r.mentions} size="small" color="primary" /></TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {r.anchors.slice(0, 3).map((a, j) => <Chip key={j} label={a || '(no text)'} size="small" variant="outlined" />)}
                                {r.anchors.length > 3 && <Chip label={`+${r.anchors.length - 3}`} size="small" />}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="warning">No related sites found. The website may have few external links.</Alert>
                )}
              </Paper>
            )}
            {!result && !isLoading && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Biotech sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography color="text.secondary">Enter your website URL to find related sites</Typography>
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

export default CompetitorFinder;
