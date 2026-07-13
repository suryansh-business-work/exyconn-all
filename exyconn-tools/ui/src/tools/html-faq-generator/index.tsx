import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Paper, Box, Typography, TextField, Button, MenuItem, CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Code, Send, UploadFile } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay } from '../../shared/components/AIToolShared';
import { useOpenAI } from '../../shared/context/OpenAIContext';
import { generateWithOpenAI, TokenUsage } from '../../shared/services/openai';
import { APIs } from '../../shared/config/apis';

const SYSTEM_PROMPT = `You are an expert FAQ content generator. Generate comprehensive, accurate FAQs based on HTML content.

When generating FAQs:
1. Create questions that real users would ask about the content
2. Provide clear, concise, and helpful answers
3. Cover the most important topics
4. Format output as numbered Q&A pairs`;

const HtmlFAQGenerator: React.FC = () => {
  const { apiKey, isKeySet } = useOpenAI();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [count, setCount] = useState(10);
  const [tone, setTone] = useState('professional');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const reader = new FileReader();
      reader.onload = (event) => setHtmlContent(event.target?.result as string);
      reader.readAsText(f);
    }
  };

  const handleGenerate = async () => {
    if (!apiKey || !htmlContent.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(APIs.converterTools.htmlToMarkdown, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: htmlContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse HTML');

      const content = data.data?.markdown || htmlContent;

      const userPrompt = `Generate ${count} FAQs in a ${tone} tone based on this HTML content:\n\n${content.substring(0, 8000)}`;
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
    <ToolLayout toolName="HTML FAQ Generator" toolIcon={<Code />} toolColor="#f97316">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Code color="primary" />
                <Typography variant="h6" fontWeight={600}>HTML Content</Typography>
              </Box>
              <Button component="label" variant="outlined" fullWidth startIcon={<UploadFile />} sx={{ mb: 2 }}>
                Upload HTML File
                <input type="file" accept=".html,.htm" hidden onChange={handleFileUpload} />
              </Button>
              <TextField fullWidth multiline rows={6} label="Or Paste HTML" placeholder="<html>...</html>"
                value={htmlContent} onChange={(e) => setHtmlContent(e.target.value)} sx={{ mb: 2, fontFamily: 'monospace' }} />
              <TextField fullWidth select label="Number of FAQs" value={count} onChange={(e) => setCount(Number(e.target.value))} sx={{ mb: 2 }}>
                {[5, 10, 15, 20, 25, 30].map((n) => (<MenuItem key={n} value={n}>{n} FAQs</MenuItem>))}
              </TextField>
              <TextField fullWidth select label="Tone" value={tone} onChange={(e) => setTone(e.target.value)} sx={{ mb: 3 }}>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="friendly">Friendly</MenuItem>
                <MenuItem value="technical">Technical</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
              </TextField>
              <Button variant="contained" fullWidth disabled={isLoading || !htmlContent.trim()} onClick={handleGenerate}
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

export default HtmlFAQGenerator;
