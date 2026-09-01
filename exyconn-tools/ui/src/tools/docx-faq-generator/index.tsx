import React, { useState } from 'react';
import {
  Container, Alert, Snackbar, Paper, Box, Typography, TextField, Button, MenuItem, CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Article, Send, UploadFile } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay, useOpenAIKey, OPENAI_SECRET_KEY } from '../../shared/components/AIToolShared';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { generateWithOpenAI, TokenUsage } from '../../shared/services/openai';
import { APIs } from '../../shared/config/apis';

const SYSTEM_PROMPT = `You are an expert FAQ content generator. Generate comprehensive, accurate FAQs based on Word document content.

When generating FAQs:
1. Create questions that real users would ask about the document
2. Provide clear, concise, and helpful answers
3. Cover the most important topics
4. Format output as numbered Q&A pairs`;

const DocxFAQGenerator: React.FC = () => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [count, setCount] = useState(10);
  const [tone, setTone] = useState('professional');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
    else setError('Please upload a valid DOCX file');
  };

  const handleGenerate = async () => {
    if (!file) return;
    const apiKey = requireKey();
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(APIs.converterTools.docxToMarkdown, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to extract DOCX content');

      const content = data.data?.markdown || '';
      if (!content) throw new Error('No content found in the document');

      const userPrompt = `Generate ${count} FAQs in a ${tone} tone based on this document:\n\n${content.substring(0, 8000)}`;
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
    <ToolLayout toolName="DOCX FAQ Generator" toolIcon={<Article />} toolColor="#0ea5e9">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Article color="primary" />
                <Typography variant="h6" fontWeight={600}>Upload DOCX</Typography>
              </Box>
              <Button component="label" variant="outlined" fullWidth startIcon={<UploadFile />} sx={{ mb: 2, py: 1.5 }}>
                {file ? file.name : 'Choose DOCX File'}
                <input type="file" accept=".docx" hidden onChange={handleFileChange} />
              </Button>
              <TextField fullWidth select label="Number of FAQs" value={count} onChange={(e) => setCount(Number(e.target.value))} sx={{ mb: 2 }}>
                {[5, 10, 15, 20, 25, 30].map((n) => (<MenuItem key={n} value={n}>{n} FAQs</MenuItem>))}
              </TextField>
              <TextField fullWidth select label="Tone" value={tone} onChange={(e) => setTone(e.target.value)} sx={{ mb: 3 }}>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="friendly">Friendly</MenuItem>
                <MenuItem value="technical">Technical</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
              </TextField>
              <Button variant="contained" fullWidth disabled={isLoading || !file} onClick={handleGenerate}
                startIcon={isLoading ? <CircularProgress size={18} /> : <Send />} sx={{ py: 1.25 }}>
                {isLoading ? 'Generating FAQs...' : 'Generate FAQs'}
              </Button>
            </Paper>
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert
                  secretKey={OPENAI_SECRET_KEY}
                  hint="FAQs are written by OpenAI from the extracted DOCX text using your own key."
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

export default DocxFAQGenerator;
