import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Paper, Box, Typography, TextField, Button, MenuItem, CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Bookmark, Send } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay } from '../../shared/components/AIToolShared';
import { useOpenAI } from '../../shared/context/OpenAIContext';
import { generateWithOpenAI, TokenUsage } from '../../shared/services/openai';
import { APIs } from '../../shared/config/apis';

const SYSTEM_PROMPT = `You are an expert FAQ content generator. Generate comprehensive, accurate FAQs based on Notion page content.

When generating FAQs:
1. Create questions that real users would ask about the content
2. Provide clear, concise, and helpful answers
3. Cover the most important topics
4. Format output as numbered Q&A pairs`;

const NotionFAQGenerator: React.FC = () => {
  const { apiKey, isKeySet } = useOpenAI();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [count, setCount] = useState(10);
  const [tone, setTone] = useState('professional');

  const handleGenerate = async () => {
    if (!apiKey || !url) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(APIs.converterTools.notionToMarkdown, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch Notion page');

      const content = data.data?.markdown || '';
      if (!content) throw new Error('No content found in the Notion page');

      const userPrompt = `Generate ${count} FAQs in a ${tone} tone based on this Notion page content:\n\n${content.substring(0, 8000)}`;
      const response = await generateWithOpenAI(apiKey, SYSTEM_PROMPT, userPrompt);
      setResult(response.content);
      setTokenUsage(response.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="Notion FAQ Generator" toolIcon={<Bookmark />} toolColor="#000000">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Bookmark color="primary" />
                <Typography variant="h6" fontWeight={600}>Notion Page URL</Typography>
              </Box>
              <TextField fullWidth label="Notion Public URL" placeholder="https://notion.so/..." value={url}
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
            {!isKeySet && <Alert severity="info" sx={{ mt: 2 }}>Please add your OpenAI API key to use this tool.</Alert>}
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

export default NotionFAQGenerator;
