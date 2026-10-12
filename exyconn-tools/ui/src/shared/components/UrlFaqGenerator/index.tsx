import React, { useState } from 'react';
import {
  Container,
  Alert,
  Snackbar,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { Send } from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import ToolLayout from '../ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay, useOpenAIKey, OPENAI_SECRET_KEY } from '../AIToolShared';
import MissingKeyAlert from '../MissingKeyAlert/MissingKeyAlert';
import { generateWithOpenAI, TokenUsage } from '../../services/openai';

export interface UrlFaqGeneratorProps {
  toolName: string;
  Icon: SvgIconComponent;
  color: string;
  /** The endpoint that fetches the URL as Markdown: takes `{ url }`, answers `{ data: { markdown } }`. */
  endpoint: string;
  /** What is fetched, as the prompts name it: "Google Docs content", "webpage content". */
  source: string;
  /** What readers ask about, as the prompt names it: "the document", "the page". */
  subject: string;
  /** True when the model is also told which URL the content came from. */
  citeUrl?: boolean;
  fetchError: string;
  emptyError: string;
  heading: string;
  urlLabel: string;
  urlPlaceholder: string;
  keyHint: string;
}

const systemPrompt = (
  source: string,
  subject: string
) => `You are an expert FAQ content generator. Generate comprehensive, accurate FAQs based on ${source}.

When generating FAQs:
1. Create questions that real users would ask about ${subject}
2. Provide clear, concise, and helpful answers
3. Cover the most important topics
4. Format output as numbered Q&A pairs`;

/** FAQs written by OpenAI from a page fetched by URL: every "<source> FAQ generator" tool. */
const UrlFaqGenerator: React.FC<Readonly<UrlFaqGeneratorProps>> = ({
  toolName,
  Icon,
  color,
  endpoint,
  source,
  subject,
  citeUrl = false,
  fetchError,
  emptyError,
  heading,
  urlLabel,
  urlPlaceholder,
  keyHint,
}) => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [count, setCount] = useState(10);
  const [tone, setTone] = useState('professional');

  const handleGenerate = async () => {
    const apiKey = requireKey();
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || fetchError);

      const content = data.data?.markdown || '';
      if (!content) throw new Error(emptyError);

      const cited = citeUrl ? `URL: ${url}\n\n` : '';
      const userPrompt = `Generate ${count} FAQs in a ${tone} tone based on this ${source}:\n\n${cited}${content.substring(0, 8000)}`;
      const response = await generateWithOpenAI(apiKey, systemPrompt(source, subject), userPrompt);
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
    <ToolLayout toolName={toolName} toolIcon={<Icon />} toolColor={color}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Icon color="primary" />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                  }}
                >
                  {heading}
                </Typography>
              </Box>
              <TextField
                fullWidth
                label={urlLabel}
                placeholder={urlPlaceholder}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                select
                label="Number of FAQs"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                sx={{ mb: 2 }}
              >
                {[5, 10, 15, 20, 25, 30].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n} FAQs
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                select
                label="Tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                sx={{ mb: 3 }}
              >
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="friendly">Friendly</MenuItem>
                <MenuItem value="technical">Technical</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
              </TextField>
              <Button
                variant="contained"
                fullWidth
                disabled={isLoading || !url}
                onClick={handleGenerate}
                startIcon={isLoading ? <CircularProgress size={18} /> : <Send />}
                sx={{ py: 1.25 }}
              >
                {isLoading ? 'Generating FAQs...' : 'Generate FAQs'}
              </Button>
            </Paper>
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert secretKey={OPENAI_SECRET_KEY} hint={keyHint} />
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <AIResultDisplay result={result} title="Generated FAQs" tokenUsage={tokenUsage} />
          </Grid>
        </Grid>
      </Container>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </ToolLayout>
  );
};

export default UrlFaqGenerator;
