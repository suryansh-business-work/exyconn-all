import React, { useState } from 'react';
import { Container, Box, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { QuestionAnswer } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay, useOpenAIKey, OPENAI_SECRET_KEY } from '../../shared/components/AIToolShared';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { generateWithOpenAI, TokenUsage } from '../../shared/services/openai';
import AnswerForm from './components/AnswerForm';

const SYSTEM_PROMPT = `You are a knowledgeable AI assistant. Your task is to provide accurate, helpful, and comprehensive answers to questions.

When answering:
1. Be clear and concise but thorough
2. Structure your answer logically
3. Use examples when helpful
4. Acknowledge limitations if you're uncertain
5. Provide actionable information when applicable`;

const AIAnswerGenerator: React.FC = () => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (question: string, context: string) => {
    const apiKey = requireKey();
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      const userPrompt = context ? `Context: ${context}\n\nQuestion: ${question}` : question;
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
    <ToolLayout toolName="AI Answer Generator" toolIcon={<QuestionAnswer />} toolColor="#3b82f6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <AnswerForm onSubmit={handleGenerate} isLoading={isLoading} />
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert
                  secretKey={OPENAI_SECRET_KEY}
                  hint="Answers are written by OpenAI using your own key, which stays in this browser."
                />
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <AIResultDisplay result={result} title="Generated Answer" tokenUsage={tokenUsage} />
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

export default AIAnswerGenerator;
