import React, { useState, useCallback } from 'react';
import { Container, Alert, Snackbar, Paper, Box, Typography, TextField, Button } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { TextFields, CheckCircle } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, useOpenAIKey, OPENAI_SECRET_KEY } from '../../shared/components/AIToolShared';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { ChatMessages, ChatInput, ChatMessage, TokenUsage } from '../../shared/components/ChatInterface';
import { generateWithOpenAI } from '../../shared/services/openai';

const SYSTEM_PROMPT = `You are an AI assistant that answers questions based on text content. Be accurate, reference specific parts when helpful.`;

const ChatWithText: React.FC = () => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [textContent, setTextContent] = useState('');
  const [isContentSet, setIsContentSet] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetContent = () => {
    if (textContent.trim().length >= 20) {
      setIsContentSet(true);
      setMessages([]);
    }
  };

  const handleSendMessage = useCallback(
    async (question: string) => {
      if (!textContent) return;
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
        const userPrompt = `Text Content:\n${textContent.substring(0, 12000)}\n\nQuestion: ${question}`;
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
    [textContent, requireKey, reportError]
  );

  return (
    <ToolLayout toolName="Chat With Text" toolIcon={<TextFields />} toolColor="#3b82f6">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <APIKeyInput />
            <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TextFields color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Paste Your Text
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={6}
                placeholder="Paste any text you want to chat about..."
                value={textContent}
                onChange={(e) => {
                  setTextContent(e.target.value);
                  setIsContentSet(false);
                }}
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                variant="contained"
                onClick={handleSetContent}
                disabled={textContent.trim().length < 20}
                startIcon={isContentSet ? <CheckCircle /> : <TextFields />}
              >
                {isContentSet ? 'Content Ready' : 'Set Content'}
              </Button>
              {isContentSet && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Content set! ({textContent.length} chars)
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
                disabled={!isContentSet}
                placeholder="Ask about this text..."
              />
            </Paper>
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert
                  secretKey={OPENAI_SECRET_KEY}
                  hint="Answers about your text come from OpenAI using your own key."
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

export default ChatWithText;
