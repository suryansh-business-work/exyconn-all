import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Alert, Snackbar, Chip,
  List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ShortText, Lightbulb } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

const SentenceRewriter: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (text.trim().length < 10) { setError('Enter at least 10 characters.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.seoTools.rewrite, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style: 'sentence' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setIsLoading(false); }
  };

  return (
    <ToolLayout toolName="Sentence Rewriter" toolIcon={<ShortText />} toolColor="#ec4899">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: '1rem' }}>
                Make Writing Clearer
              </Typography>
              <TextField fullWidth size="small" label="Enter sentence(s)" placeholder="Type your sentence(s)..."
                value={text} onChange={(e) => setText(e.target.value)} multiline rows={6} sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" onClick={handleAnalyze}
                disabled={isLoading || text.trim().length < 10}
                startIcon={<ShortText />}
                sx={{ textTransform: 'none', bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}>
                {isLoading ? 'Analyzing...' : 'Analyze Sentences'}
              </Button>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {result && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Analysis</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip size="small" label={`${result.wordCount} words`} />
                    <Chip size="small" label={`${result.sentenceCount} sentences`} />
                    <Chip size="small" label={`Avg ${result.averageSentenceLength} words/sentence`} />
                    <Chip size="small" label={`Readability: ${result.readability}`}
                      color={result.readability === 'Easy' ? 'success' : result.readability === 'Moderate' ? 'warning' : 'error'} />
                  </Box>
                </Paper>
                {Array.isArray(result.suggestions) && result.suggestions.length > 0 && (
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Improvement Suggestions</Typography>
                    <List dense>
                      {(result.suggestions as string[]).map((s, idx) => (
                        <ListItem key={idx} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <Lightbulb sx={{ fontSize: 16, color: 'warning.main' }} />
                          </ListItemIcon>
                          <ListItemText primary={s} primaryTypographyProps={{ variant: 'body2', fontSize: '0.8rem' }} />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                )}
                {typeof result.note === 'string' && result.note && (
                  <Alert severity="info" variant="outlined" sx={{ fontSize: '0.8rem' }}>
                    {result.note}
                  </Alert>
                )}
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

export default SentenceRewriter;
