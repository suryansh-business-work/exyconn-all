import React, { useState, useCallback } from 'react';
import { Container, Alert, Snackbar, Paper, Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Language, Link } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, useOpenAIKey, OPENAI_SECRET_KEY } from '../../shared/components/AIToolShared';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { ChatMessages, ChatInput, ChatMessage, TokenUsage } from '../../shared/components/ChatInterface';
import { generateWithOpenAI } from '../../shared/services/openai';
import { APIs } from '../../shared/config/apis';

const SYSTEM_PROMPT = `You are an AI assistant that answers questions based on website content. Be accurate, quote relevant parts when appropriate.`;

const ChatWithWebsite: React.FC = () => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteContent, setWebsiteContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchWebsite = async () => {
    if (!websiteUrl.trim()) return;
    setIsLoadingContent(true);
    setError(null);
    try {
      const res = await fetch(APIs.chatTools.scrapeWebsite, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setWebsiteContent(data.content);
      setMessages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch website');
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleSendMessage = useCallback(
    async (question: string) => {
      if (!websiteContent) return;
      const apiKey = requireKey();
      if (!apiKey) return;
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      try {
        const userPrompt = `Website Content:\n${websiteContent.substring(0, 12000)}\n\nQuestion: ${question}`;
        const response = await generateWithOpenAI(apiKey, SYSTEM_PROMPT, userPrompt);
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setTokenUsage(response.usage);
      } catch (err) {
        reportError(err);
        setError(err instanceof Error ? err.message : 'Failed to generate');
      } finally {
        setIsLoading(false);
      }
    },
    [websiteContent, requireKey, reportError]
  );

  return (
    <ToolLayout toolName="Chat With Website" toolIcon={<Language />} toolColor="#8b5cf6">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <APIKeyInput />
            <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Link color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Website URL
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleFetchWebsite}
                disabled={isLoadingContent || !websiteUrl.trim()}
                startIcon={isLoadingContent ? <CircularProgress size={18} /> : <Language />}
              >
                {isLoadingContent ? 'Fetching...' : 'Fetch Website'}
              </Button>
              {websiteContent && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Content loaded! ({websiteContent.length} chars)
                </Alert>
              )}
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              elevation={0}
              sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                height: 480,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Chat
                </Typography>
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <ChatMessages messages={messages} tokenUsage={tokenUsage} />
              </Box>
              <ChatInput
                onSend={handleSendMessage}
                isLoading={isLoading}
                disabled={!websiteContent}
                placeholder="Ask about this website..."
              />
            </Paper>
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert
                  secretKey={OPENAI_SECRET_KEY}
                  hint="Answers about the fetched page come from OpenAI using your own key."
                />
              </Box>
            )}
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

export default ChatWithWebsite;
