import React, { useState } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Psychology } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay } from '../../shared/components/AIToolShared';
import { useOpenAI } from '../../shared/context/OpenAIContext';
import { generateWithOpenAI, TokenUsage } from '../../shared/services/openai';
import PromptForm from './components/PromptForm';

const SYSTEM_PROMPT = `You are an expert AI prompt engineer. Your task is to generate high-quality, effective prompts that will produce excellent results when used with AI models like ChatGPT, Claude, or similar.

When generating prompts:
1. Be specific and detailed
2. Include context and constraints
3. Define the expected output format
4. Add role-playing elements when appropriate
5. Include examples if helpful

Generate a comprehensive, well-structured prompt based on the user's topic.`;

const AIPromptGenerator: React.FC = () => {
  const { apiKey, isKeySet } = useOpenAI();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (topic: string, context: string) => {
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      const userPrompt = `Generate a high-quality AI prompt for: "${topic}"${context ? `\n\nAdditional context: ${context}` : ''}`;
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
    <ToolLayout toolName="AI Prompt Generator" toolIcon={<Psychology />} toolColor="#ec4899">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <PromptForm onSubmit={handleGenerate} isLoading={isLoading} />
            {!isKeySet && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please add your OpenAI API key to use this tool.
              </Alert>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <AIResultDisplay result={result} title="Generated Prompt" tokenUsage={tokenUsage} />
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

export default AIPromptGenerator;
