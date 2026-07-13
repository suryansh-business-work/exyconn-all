import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Snackbar,
  Paper, LinearProgress, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ListAlt, Search, ContentCopy } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface KeywordResult { keyword: string; wordCount: number; charCount: number }

const SerpChecker: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch(APIs.seoTools.keywordSuggest, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch data');
      setResults(data.data.keywords || []);
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
    <ToolLayout toolName="SERP Checker" toolIcon={<ListAlt />} toolColor="#f97316">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom><Search sx={{ mr: 1, verticalAlign: 'middle' }} />SERP Analysis</Typography>
              <TextField fullWidth size="small" label="Keyword" placeholder="e.g., best seo tools" value={keyword} onChange={(e) => setKeyword(e.target.value)} sx={{ mb: 2 }} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
              <Button fullWidth variant="contained" onClick={handleSearch} disabled={isLoading || !keyword.trim()} sx={{ textTransform: 'none', bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}>
                {isLoading ? 'Analyzing...' : 'Analyze SERP'}
              </Button>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Live Google SERP results require Google Custom Search API. This tool shows real related search queries from Google Autocomplete to help understand SERP landscape.
              </Alert>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {results.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Related Searches for &quot;{keyword}&quot;</Typography>
                  <Button size="small" startIcon={<ContentCopy />} onClick={handleCopy} sx={{ textTransform: 'none' }}>
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </Box>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell width={50}>#</TableCell>
                        <TableCell>Related Search Query</TableCell>
                        <TableCell align="center">Words</TableCell>
                        <TableCell align="center">Length</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.map((r, i) => (
                        <TableRow key={i} hover>
                          <TableCell><Chip label={i + 1} size="small" color={i < 3 ? 'success' : i < 10 ? 'primary' : 'default'} /></TableCell>
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
                <ListAlt sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography color="text.secondary">Enter a keyword to analyze related search queries</Typography>
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

export default SerpChecker;
