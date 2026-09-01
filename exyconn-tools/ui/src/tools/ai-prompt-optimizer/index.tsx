import React, { useState } from 'react';
import { Container, Box, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { AutoAwesome } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay, useOpenAIKey, OPENAI_SECRET_KEY } from '../../shared/components/AIToolShared';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { generateWithOpenAI, TokenUsage } from '../../shared/services/openai';
import OptimizerForm from './components/OptimizerForm';

const SYSTEM_PROMPT = `You are an expert AI prompt optimizer. Your task is to take an existing prompt and improve it significantly.

When optimizing prompts:
1. Make the prompt clearer and more specific
2. Add structure and formatting
3. Include role-playing elements if missing
4. Add constraints and output format specifications
5. Remove ambiguity
6. Keep the original intent intact

Provide the optimized prompt and briefly explain the improvements made.`;

const AIPromptOptimizer: React.FC = () => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async (prompt: string, goal: string) => {
    const apiKey = requireKey();
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      const userPrompt = `Optimize this prompt:\n\n"${prompt}"${goal ? `\n\nOptimization goal: ${goal}` : ''}`;
      const response = await generateWithOpenAI(apiKey, SYSTEM_PROMPT, userPrompt);
      setResult(response.content);
      setTokenUsage(response.usage);
    } catch (err) {
      reportError(err);
      setError(err instanceof Error ? err.message : 'Failed to optimize');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="AI Prompt Optimizer" toolIcon={<AutoAwesome />} toolColor="#8b5cf6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <OptimizerForm onSubmit={handleOptimize} isLoading={isLoading} />
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert
                  secretKey={OPENAI_SECRET_KEY}
                  hint="Rewrites run through OpenAI using your own key, which stays in this browser."
                />
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <AIResultDisplay result={result} title="Optimized Prompt" tokenUsage={tokenUsage} />
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

export default AIPromptOptimizer;
