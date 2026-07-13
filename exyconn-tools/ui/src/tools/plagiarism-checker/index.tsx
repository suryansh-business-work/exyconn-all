import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Alert, Snackbar,
  Chip, LinearProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ContentPaste } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface PlagiarismResult {
  totalWords: number;
  uniqueWords: number;
  uniquenessScore: number;
  totalSentences: number;
  averageWordsPerSentence: number;
  repeatedPhrases: Array<{ phrase: string; count: number }>;
  readabilityLevel: string;
  note: string;
}

const PlagiarismChecker: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<PlagiarismResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!text.trim() || text.trim().length < 10) {
      setError('Please enter at least 10 characters of text.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.seoTools.plagiarismCheck, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="Plagiarism Checker" toolIcon={<ContentPaste />} toolColor="#ef4444">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: '1rem' }}>
                Check Content Uniqueness
              </Typography>
              <TextField fullWidth size="small" label="Enter text" placeholder="Paste your content here..."
                value={text} onChange={(e) => setText(e.target.value)} multiline rows={10} sx={{ mb: 2 }} />
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                {text.split(/\s+/).filter(Boolean).length} words
              </Typography>
              <Button fullWidth variant="contained" color="error" onClick={handleCheck}
                disabled={isLoading || text.trim().length < 10}
                startIcon={<ContentPaste />} sx={{ textTransform: 'none' }}>
                {isLoading ? 'Analyzing...' : 'Check Plagiarism'}
              </Button>
              {isLoading && <LinearProgress sx={{ mt: 2 }} />}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            {result && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Uniqueness Score</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{
                      width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: result.uniquenessScore >= 80 ? 'success.main' : result.uniquenessScore >= 50 ? 'warning.main' : 'error.main',
                      color: 'white',
                    }}>
                      <Typography variant="h5" fontWeight={800}>{result.uniquenessScore}%</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Content Uniqueness</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {result.totalWords} words, {result.totalSentences} sentences
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip size="small" label={`${result.uniqueWords} unique words`} />
                    <Chip size="small" label={`${result.averageWordsPerSentence} avg words/sentence`} />
                    <Chip size="small" label={`Readability: ${result.readabilityLevel}`}
                      color={result.readabilityLevel === 'Easy' ? 'success' : result.readabilityLevel === 'Moderate' ? 'warning' : 'error'} />
                  </Box>
                </Paper>

                {result.repeatedPhrases.length > 0 && (
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Repeated Phrases</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Phrase</TableCell>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="right">Count</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {result.repeatedPhrases.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{item.phrase}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }} align="right">{item.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}

                <Alert severity="info" variant="outlined" sx={{ fontSize: '0.8rem' }}>
                  {result.note}
                </Alert>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default PlagiarismChecker;
