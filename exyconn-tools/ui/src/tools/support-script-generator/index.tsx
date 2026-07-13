import React, { useState } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { SupportAgent } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay } from '../../shared/components/AIToolShared';
import { useOpenAI } from '../../shared/context/OpenAIContext';
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
  const { apiKey, isKeySet } = useOpenAI();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (topic: string, industry: string, tone: string, scenarios: string) => {
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
            {!isKeySet && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please add your OpenAI API key to use this tool.
              </Alert>
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
