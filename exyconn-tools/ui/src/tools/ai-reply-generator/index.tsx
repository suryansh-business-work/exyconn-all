import React, { useState } from 'react';
import { Container, Box, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Reply } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay, useOpenAIKey, OPENAI_SECRET_KEY } from '../../shared/components/AIToolShared';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { generateWithOpenAI, TokenUsage } from '../../shared/services/openai';
import ReplyForm from './components/ReplyForm';

const SYSTEM_PROMPT = `You are an expert at crafting thoughtful, contextually appropriate replies. Your task is to generate smart replies to messages.

When generating replies:
1. Match the requested tone exactly
2. Address all points in the original message
3. Be clear and articulate
4. Keep an appropriate length (not too short, not too long)
5. Sound natural and human`;

const AIReplyGenerator: React.FC = () => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (message: string, tone: string, context: string) => {
    const apiKey = requireKey();
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      const userPrompt = `Generate a ${tone.toLowerCase()} reply to this message:\n\n"${message}"${context ? `\n\nAdditional context: ${context}` : ''}`;
      const response = await generateWithOpenAI(apiKey, SYSTEM_PROMPT, userPrompt);
      setResult(response.content);
      setTokenUsage(response.usage);
    } catch (err) {
      reportError(err);
      setError(err instanceof Error ? err.message : 'Failed to generate');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="AI Reply Generator" toolIcon={<Reply />} toolColor="#22c55e">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <ReplyForm onSubmit={handleGenerate} isLoading={isLoading} />
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert
                  secretKey={OPENAI_SECRET_KEY}
                  hint="Replies are drafted by OpenAI using your own key, which stays in this browser."
                />
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <AIResultDisplay result={result} title="Generated Reply" tokenUsage={tokenUsage} />
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

export default AIReplyGenerator;
