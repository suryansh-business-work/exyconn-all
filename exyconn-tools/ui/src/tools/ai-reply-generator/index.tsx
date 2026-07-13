import React, { useState } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Reply } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay } from '../../shared/components/AIToolShared';
import { useOpenAI } from '../../shared/context/OpenAIContext';
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
  const { apiKey, isKeySet } = useOpenAI();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (message: string, tone: string, context: string) => {
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      const userPrompt = `Generate a ${tone.toLowerCase()} reply to this message:\n\n"${message}"${context ? `\n\nAdditional context: ${context}` : ''}`;
      const response = await generateWithOpenAI(apiKey, SYSTEM_PROMPT, userPrompt);
      setResult(response.content);
      setTokenUsage(response.usage);
    } catch (err) {
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
            {!isKeySet && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please add your OpenAI API key to use this tool.
              </Alert>
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
