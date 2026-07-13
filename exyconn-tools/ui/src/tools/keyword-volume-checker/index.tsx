import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Snackbar,
  Paper, LinearProgress, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Analytics, Search, ContentCopy } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface SuggestionResult { keyword: string; wordCount: number; charCount: number }

const KeywordVolumeChecker: React.FC = () => {
  const [keywords, setKeywords] = useState('');
  const [results, setResults] = useState<SuggestionResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCheck = async () => {
    const kwList = keywords.split('\n').map((k) => k.trim()).filter(Boolean);
    if (kwList.length === 0) return;
    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
      const allResults: SuggestionResult[] = [];
      for (const kw of kwList.slice(0, 5)) {
        const res = await fetch(APIs.seoTools.keywordSuggest, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: kw }),
        });
        const data = await res.json();
        if (data.success && data.data.keywords) allResults.push(...data.data.keywords);
      }
      const seen = new Set<string>();
      setResults(allResults.filter((r) => { if (seen.has(r.keyword)) return false; seen.add(r.keyword); return true; }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(results.map((r) => r.keyword).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout toolName="Keyword Search Volume" toolIcon={<Analytics />} toolColor="#6366f1">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom><Search sx={{ mr: 1, verticalAlign: 'middle' }} />Keyword Ideas</Typography>
              <TextField fullWidth size="small" multiline rows={6} label="Keywords (one per line, max 5)" placeholder={'digital marketing\nseo tools\ncontent marketing'} value={keywords} onChange={(e) => setKeywords(e.target.value)} sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" onClick={handleCheck} disabled={isLoading || !keywords.trim()} sx={{ textTransform: 'none', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
                {isLoading ? 'Fetching...' : 'Get Keyword Ideas'}
              </Button>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Search volume, CPC, and competition data require Google Ads API (Keyword Planner). This tool shows real keyword suggestions from Google Autocomplete instead.
              </Alert>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {results.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{results.length} Keyword Ideas</Typography>
                  <Button size="small" startIcon={<ContentCopy />} onClick={handleCopy} sx={{ textTransform: 'none' }}>
                    {copied ? 'Copied!' : 'Copy All'}
                  </Button>
                </Box>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Keyword</TableCell>
                        <TableCell align="center">Words</TableCell>
                        <TableCell align="center">Characters</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.map((r, i) => (
                        <TableRow key={i} hover>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell>{r.keyword}</TableCell>
                          <TableCell align="center"><Chip label={r.wordCount} size="small" variant="outlined" /></TableCell>
                          <TableCell align="center">{r.charCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
            {results.length === 0 && !isLoading && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Analytics sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography color="text.secondary">Enter keywords to get real suggestions from Google</Typography>
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

export default KeywordVolumeChecker;
