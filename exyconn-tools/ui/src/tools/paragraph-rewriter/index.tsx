import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Alert, Snackbar, Chip,
  List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ContentCopy, Lightbulb } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface RewriteResult {
  original: string;
  wordCount: number;
  sentenceCount: number;
  averageSentenceLength: number;
  readability: string;
  suggestions: string[];
  style: string;
  note: string;
}

const ParagraphRewriter: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<RewriteResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRewrite = async () => {
    if (text.trim().length < 10) { setError('Enter at least 10 characters.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.seoTools.rewrite, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style: 'professional' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setIsLoading(false); }
  };

  return (
    <ToolLayout toolName="Paragraph Rewriter" toolIcon={<ContentCopy />} toolColor="#22c55e">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: '1rem' }}>
                Analyze & Improve Text
              </Typography>
              <TextField fullWidth size="small" label="Enter text" placeholder="Paste your paragraph..."
                value={text} onChange={(e) => setText(e.target.value)} multiline rows={10} sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" color="success" onClick={handleRewrite}
                disabled={isLoading || text.trim().length < 10}
                startIcon={<ContentCopy />} sx={{ textTransform: 'none' }}>
                {isLoading ? 'Analyzing...' : 'Analyze Text'}
              </Button>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {result && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Text Analysis</Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip size="small" label={`${result.wordCount} words`} />
                    <Chip size="small" label={`${result.sentenceCount} sentences`} />
                    <Chip size="small" label={`Avg ${result.averageSentenceLength} words/sentence`} />
                    <Chip size="small" label={`Readability: ${result.readability}`}
                      color={result.readability === 'Easy' ? 'success' : result.readability === 'Moderate' ? 'warning' : 'error'} />
                  </Box>
                </Paper>

                {result.suggestions.length > 0 && (
                  <Paper sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Suggestions</Typography>
                    <List dense>
                      {result.suggestions.map((s, idx) => (
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

export default ParagraphRewriter;
