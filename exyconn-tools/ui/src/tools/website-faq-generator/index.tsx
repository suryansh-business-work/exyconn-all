import React, { useState } from 'react';
import { Container, Alert, Snackbar } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Language } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, AIResultDisplay } from '../../shared/components/AIToolShared';
import { useOpenAI } from '../../shared/context/OpenAIContext';
import { generateWithOpenAI, TokenUsage } from '../../shared/services/openai';
import { APIs } from '../../shared/config/apis';
import FAQForm from './components/FAQForm';

const SYSTEM_PROMPT = `You are an expert FAQ content generator. Your task is to generate comprehensive, accurate FAQs based on website content provided to you.

When generating FAQs:
1. Create questions that real users would ask
2. Provide clear, concise, and helpful answers
3. Cover the most important topics from the content
4. Structure answers in an easy-to-read format
5. Include relevant details without being overly verbose
6. Format output as numbered Q&A pairs with clear separation`;

const WebsiteFAQGenerator: React.FC = () => {
  const { apiKey, isKeySet } = useOpenAI();
  const [result, setResult] = useState('');
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (url: string, count: number, tone: string) => {
    if (!apiKey) return;
    setIsLoading(true);
    setError(null);

    try {
      // First scrape the website content
      const scrapeRes = await fetch(APIs.chatTools.scrapeWebsite, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Failed to fetch website content');

      const websiteContent = scrapeData.data?.content || scrapeData.content || '';
      if (!websiteContent) throw new Error('No content found on the website');

      const userPrompt = `Generate ${count} FAQs in a ${tone} tone based on the following website content:\n\nURL: ${url}\n\nContent:\n${websiteContent.substring(0, 8000)}`;
      const response = await generateWithOpenAI(apiKey, SYSTEM_PROMPT, userPrompt);
      setResult(response.content);
      setTokenUsage(response.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate FAQs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ToolLayout toolName="Website FAQ Generator" toolIcon={<Language />} toolColor="#14b8a6">
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 5 }}>
            <APIKeyInput />
            <FAQForm onSubmit={handleGenerate} isLoading={isLoading} />
            {!isKeySet && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please add your OpenAI API key to use this tool.
              </Alert>
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

export default WebsiteFAQGenerator;
