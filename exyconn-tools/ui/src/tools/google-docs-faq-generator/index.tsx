import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Paper, Box, Typography, TextField, Button, MenuItem, CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { CloudSync, Send } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay, useOpenAIKey, OPENAI_SECRET_KEY } from '../../shared/components/AIToolShared';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { generateWithOpenAI, TokenUsage } from '../../shared/services/openai';
import { APIs } from '../../shared/config/apis';

const SYSTEM_PROMPT = `You are an expert FAQ content generator. Generate comprehensive, accurate FAQs based on Google Docs content.

When generating FAQs:
1. Create questions that real users would ask about the document
2. Provide clear, concise, and helpful answers
3. Cover the most important topics
4. Format output as numbered Q&A pairs`;

const GoogleDocsFAQGenerator: React.FC = () => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [count, setCount] = useState(10);
  const [tone, setTone] = useState('professional');

  const handleGenerate = async () => {
    if (!url) return;
    const apiKey = requireKey();
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(APIs.converterTools.googleDocsToMarkdown, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch Google Doc');

      const content = data.data?.markdown || '';
      if (!content) throw new Error('No content found in the document');

      const userPrompt = `Generate ${count} FAQs in a ${tone} tone based on this Google Docs content:\n\n${content.substring(0, 8000)}`;
      const response = await generateWithOpenAI(apiKey, SYSTEM_PROMPT, userPrompt);
      setResult(response.content);
      setTokenUsage(response.usage);
    } catch (err) {
      reportError(err);
      setError(err instanceof Error ? err.message : 'Failed to generate FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="Google Docs FAQ Generator" toolIcon={<CloudSync />} toolColor="#4285f4">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CloudSync color="primary" />
                <Typography variant="h6" fontWeight={600}>Google Docs URL</Typography>
              </Box>
              <TextField fullWidth label="Google Docs URL" placeholder="https://docs.google.com/document/d/..." value={url}
                onChange={(e) => setUrl(e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth select label="Number of FAQs" value={count} onChange={(e) => setCount(Number(e.target.value))} sx={{ mb: 2 }}>
                {[5, 10, 15, 20, 25, 30].map((n) => (<MenuItem key={n} value={n}>{n} FAQs</MenuItem>))}
              </TextField>
              <TextField fullWidth select label="Tone" value={tone} onChange={(e) => setTone(e.target.value)} sx={{ mb: 3 }}>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="friendly">Friendly</MenuItem>
                <MenuItem value="technical">Technical</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
              </TextField>
              <Button variant="contained" fullWidth disabled={isLoading || !url} onClick={handleGenerate}
                startIcon={isLoading ? <CircularProgress size={18} /> : <Send />} sx={{ py: 1.25 }}>
                {isLoading ? 'Generating FAQs...' : 'Generate FAQs'}
              </Button>
            </Paper>
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert
                  secretKey={OPENAI_SECRET_KEY}
                  hint="FAQs are written by OpenAI from the fetched Google Doc using your own key."
                />
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <AIResultDisplay result={result} title="Generated FAQs" tokenUsage={tokenUsage} />
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default GoogleDocsFAQGenerator;
