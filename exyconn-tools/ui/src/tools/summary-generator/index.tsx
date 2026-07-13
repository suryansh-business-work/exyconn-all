import React, { useState } from 'react';
import {
  Container, Box, Typography, TextField, Button, Paper, Alert, Snackbar, Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Summarize } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIs } from '../../shared/config/apis';

interface SummaryResult {
  summary: string;
  originalLength: number;
  summaryLength: number;
  compressionRatio: number;
  totalSentences: number;
  summarySentences: number;
}

const SummaryGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (text.trim().length < 10) { setError('Enter at least 10 characters.'); return; }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(APIs.seoTools.summary, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally { setIsLoading(false); }
  };

  return (
    <ToolLayout toolName="Summary Generator" toolIcon={<Summarize />} toolColor="#0ea5e9">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, fontSize: '1rem' }}>
                Generate Summary
              </Typography>
              <TextField fullWidth size="small" label="Enter text" placeholder="Paste your content here..."
                value={text} onChange={(e) => setText(e.target.value)} multiline rows={12} sx={{ mb: 2 }} />
              <Button fullWidth variant="contained" onClick={handleGenerate}
                disabled={isLoading || text.trim().length < 10}
                startIcon={<Summarize />} sx={{ textTransform: 'none' }}>
                {isLoading ? 'Generating...' : 'Generate Summary'}
              </Button>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            {result && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Summary</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  <Chip size="small" label={`${result.compressionRatio}% compressed`} color="success" />
                  <Chip size="small" label={`${result.summarySentences}/${result.totalSentences} sentences`} />
                  <Chip size="small" label={`${result.summaryLength}/${result.originalLength} chars`} />
                </Box>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1 }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {result.summary}
                  </Typography>
                </Paper>
                <Button size="small" sx={{ mt: 1.5, textTransform: 'none' }}
                  onClick={() => navigator.clipboard.writeText(result.summary)}>
                  Copy Summary
                </Button>
              </Paper>
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

export default SummaryGenerator;
