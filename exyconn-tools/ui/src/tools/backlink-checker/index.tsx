import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  Paper,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Link, Search, OpenInNew } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';
import { withUniqueKeys } from '../../shared/utils/uniqueKeys';

interface LinkItem {
  url: string;
  anchor: string;
  nofollow: boolean;
}
interface BacklinkResult {
  domain: string;
  internalLinks: { total: number; links: LinkItem[] };
  externalLinks: {
    total: number;
    dofollow: number;
    nofollow: number;
    uniqueDomains: number;
    domainList: string[];
    links: LinkItem[];
  };
  summary: { totalLinks: number; internalCount: number; externalCount: number; uniqueExternalDomains: number };
}

/** `part` of `total` as a whole-number percentage, "0%" when there is nothing to divide. */
const percentOf = (part: number, total: number) => `${total === 0 ? 0 : Math.round((part / total) * 100)}%`;

const BacklinkChecker: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<BacklinkResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!domain.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const url = domain.startsWith('http') ? domain : `https://${domain}`;
      const res = await fetch(APIs.seoTools.backlinkAnalyze, {
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

  return (
    <ToolLayout toolName="Backlink Checker" toolIcon={<Link />} toolColor="#0ea5e9">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                <Search sx={{ mr: 1, verticalAlign: 'middle' }} />
                Analyze Links
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="URL"
                placeholder="https://example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                sx={{ mb: 2 }}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleCheck}
                disabled={isLoading || !domain.trim()}
                sx={{ textTransform: 'none', bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}
              >
                {isLoading ? 'Analyzing...' : 'Analyze Links'}
              </Button>
              <Alert severity="info" sx={{ mt: 2 }}>
                Analyzes all links on the page — internal, external, dofollow, and nofollow. Real on-page link data.
              </Alert>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {result && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Link Analysis: {result.domain}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                  {[
                    { label: 'Total Links', value: result.summary.totalLinks, color: '#0ea5e9' },
                    {
                      label: 'Internal',
                      value: `${result.internalLinks.total} (${percentOf(result.internalLinks.total, result.summary.totalLinks)})`,
                      color: '#22c55e',
                    },
                    {
                      label: 'External',
                      value: `${result.externalLinks.total} (${percentOf(result.externalLinks.total, result.summary.totalLinks)})`,
                      color: '#8b5cf6',
                    },
                    {
                      label: 'Nofollow',
                      value: `${result.externalLinks.nofollow} (${percentOf(result.externalLinks.nofollow, result.externalLinks.total)})`,
                      color: '#f59e0b',
                    },
                  ].map((m) => (
                    <Paper key={m.label} variant="outlined" sx={{ p: 2, flex: '1 1 120px', textAlign: 'center' }}>
                      <Typography
                        variant="h6"
                        color={m.color}
                        sx={{
                          fontWeight: 'bold',
                        }}
                      >
                        {m.value}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                        }}
                      >
                        {m.label}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
                {result.externalLinks.domainList.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Unique External Domains ({result.externalLinks.uniqueDomains})
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {result.externalLinks.domainList.map((d) => (
                        <Chip key={d} label={d} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}
                {result.externalLinks.links.length > 0 && (
                  <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>External URL</TableCell>
                          <TableCell>Anchor Text</TableCell>
                          <TableCell>Rel</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {withUniqueKeys(result.externalLinks.links, (b) => `${b.url}|${b.anchor}|${b.nofollow}`).map(
                          ({ key, item: b }) => (
                            <TableRow key={key} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: 300 }}>
                                  <Typography variant="body2" noWrap>
                                    {b.url}
                                  </Typography>
                                  <OpenInNew
                                    sx={{ fontSize: 14, color: 'action.disabled', cursor: 'pointer' }}
                                    onClick={() => window.open(b.url, '_blank')}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell>{b.anchor || '(no anchor)'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={b.nofollow ? 'nofollow' : 'dofollow'}
                                  color={b.nofollow ? 'default' : 'success'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}
            {!result && !isLoading && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Link sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography
                  sx={{
                    color: 'text.secondary',
                  }}
                >
                  Enter a URL to analyze its link profile
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
        <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError(null)}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </ToolLayout>
  );
};

export default BacklinkChecker;
