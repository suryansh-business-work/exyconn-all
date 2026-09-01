import React, { useState } from 'react';
import { Container, Box, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Business } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay, useOpenAIKey, OPENAI_SECRET_KEY } from '../../shared/components/AIToolShared';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { generateWithOpenAI, TokenUsage } from '../../shared/services/openai';
import SaasNameForm from './components/SaasNameForm';

const SYSTEM_PROMPT = `You are an expert brand naming consultant specializing in SaaS products. Your task is to generate brandable, memorable company names.

When generating names:
1. Make them unique and memorable
2. Keep them short (ideally 1-2 syllables)
3. Ensure they're easy to spell and pronounce
4. Check that they could work as a domain (.com, .io, .app)
5. Mix approaches: made-up words, portmanteaus, real words with a twist
6. Avoid generic tech buzzwords
7. Include a brief explanation for each name

Format: Return as a numbered list with the name and a brief explanation of its meaning/appeal.`;

const AISaasNameGenerator: React.FC = () => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (description: string, keywords: string, style: string, count: number) => {
    const apiKey = requireKey();
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      const userPrompt = `Generate ${count} brandable SaaS names for:\n\nProduct: ${description}\nStyle: ${style}${keywords ? `\nKeywords to consider: ${keywords}` : ''}`;
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
    <ToolLayout toolName="AI SaaS Name Generator" toolIcon={<Business />} toolColor="#6366f1">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <SaasNameForm onSubmit={handleGenerate} isLoading={isLoading} />
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert
                  secretKey={OPENAI_SECRET_KEY}
                  hint="Name ideas come from OpenAI using your own key, which stays in this browser."
                />
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <AIResultDisplay result={result} title="Generated SaaS Names" tokenUsage={tokenUsage} />
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

export default AISaasNameGenerator;
