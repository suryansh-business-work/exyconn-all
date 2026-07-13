import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Alert, Snackbar,
  Paper, LinearProgress, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Search, TrendingUp, ContentCopy } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface KeywordSuggestion {
  keyword: string;
  wordCount: number;
  charCount: number;
}

const KeywordTool: React.FC = () => {
  const [seed, setSeed] = useState('');
  const [results, setResults] = useState<KeywordSuggestion[]>([]);
  const [totalSuggestions, setTotalSuggestions] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSearch = async () => {
    if (!seed.trim()) return;
    setIsLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch(APIs.seoTools.keywordSuggest, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: seed.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch suggestions');
      setResults(data.data.keywords || []);
      setTotalSuggestions(data.data.totalSuggestions || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    const text = results.map((r) => r.keyword).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ToolLayout toolName="Keyword Tool" toolIcon={<Search />} toolColor="#f59e0b">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {isLoading && <LinearProgress sx={{ mb: 2 }} />}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom><TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />Find Keywords</Typography>
              <TextField fullWidth size="small" label="Seed Keyword" placeholder="e.g., digital marketing" value={seed} onChange={(e) => setSeed(e.target.value)} sx={{ mb: 2 }} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
              <Button fullWidth variant="contained" onClick={handleSearch} disabled={isLoading || !seed.trim()} sx={{ textTransform: 'none', bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}>
                {isLoading ? 'Finding...' : 'Find Keywords'}
              </Button>
              <Alert severity="info" sx={{ mt: 2 }}>Real keyword suggestions powered by Google Autocomplete. These are actual search queries people type on Google.</Alert>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            {results.length > 0 && (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{totalSuggestions} Keywords Found</Typography>
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
                <Search sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                <Typography color="text.secondary">Enter a seed keyword to find real Google suggestions</Typography>
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

export default KeywordTool;
