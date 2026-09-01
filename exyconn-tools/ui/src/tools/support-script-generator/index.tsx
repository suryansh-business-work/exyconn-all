import React, { useState } from 'react';
import { Container, Box, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { SupportAgent } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay, useOpenAIKey, OPENAI_SECRET_KEY } from '../../shared/components/AIToolShared';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { generateWithOpenAI, TokenUsage } from '../../shared/services/openai';
import ScriptForm from './components/ScriptForm';

const SYSTEM_PROMPT = `You are an expert customer support script writer. Your task is to generate professional, comprehensive customer support scripts.

When generating scripts:
1. Include greeting and opening statements
2. Cover common customer scenarios and responses
3. Include troubleshooting steps
4. Add escalation procedures
5. Include closing statements and follow-up actions
6. Use empathetic and professional language
7. Format with clear sections and numbered steps
8. Include sample dialogues for key scenarios`;

const SupportScriptGenerator: React.FC = () => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (topic: string, industry: string, tone: string, scenarios: string) => {
    const apiKey = requireKey();
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      const userPrompt = `Generate a comprehensive customer support script for:
Topic: ${topic}
Industry: ${industry}
Tone: ${tone}
${scenarios ? `\nSpecific Scenarios:\n${scenarios}` : ''}

Include greeting templates, response templates for common issues, troubleshooting steps, escalation procedures, and closing statements.`;
      const response = await generateWithOpenAI(apiKey, SYSTEM_PROMPT, userPrompt);
      setResult(response.content);
      setTokenUsage(response.usage);
    } catch (err) {
      reportError(err);
      setError(err instanceof Error ? err.message : 'Failed to generate script');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="Customer Support Script Generator" toolIcon={<SupportAgent />} toolColor="#22c55e">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <ScriptForm onSubmit={handleGenerate} isLoading={isLoading} />
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert
                  secretKey={OPENAI_SECRET_KEY}
                  hint="Scripts are written by OpenAI using your own key, which stays in this browser."
                />
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <AIResultDisplay result={result} title="Generated Support Script" tokenUsage={tokenUsage} />
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

export default SupportScriptGenerator;
