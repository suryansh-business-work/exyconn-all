import React, { useState, useCallback } from 'react';
import { Container, Alert, Snackbar, Paper, Box, Typography, TextField, Button, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Insights, Analytics, CheckCircle } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, useOpenAIKey, OPENAI_SECRET_KEY } from '../../shared/components/AIToolShared';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { ChatMessages, ChatInput, ChatMessage, TokenUsage } from '../../shared/components/ChatInterface';
import { generateWithOpenAI } from '../../shared/services/openai';

const SYSTEM_PROMPT = `You are an expert chatbot conversation analyst. Analyze chat logs and provide actionable insights about user intents, bot performance, and improvement suggestions.`;

const focusAreas = [
  { value: '', label: 'General Analysis' },
  { value: 'user_satisfaction', label: 'User Satisfaction' },
  { value: 'bot_accuracy', label: 'Bot Accuracy' },
  { value: 'conversation_flow', label: 'Conversation Flow' },
  { value: 'improvement_opportunities', label: 'Improvement Opportunities' },
];

const AIChatAnalyzer: React.FC = () => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [chatLog, setChatLog] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [isContentSet, setIsContentSet] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetContent = () => {
    if (chatLog.trim().length >= 50) {
      setIsContentSet(true);
      setMessages([]);
    }
  };

  const handleSendMessage = useCallback(
    async (question: string) => {
      if (!chatLog) return;
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
        const userPrompt = `Chat Log to Analyze:\n${chatLog.substring(0, 10000)}\n\n${focusArea ? `Focus: ${focusArea}\n\n` : ''}Question: ${question}`;
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
        setError(err instanceof Error ? err.message : 'Failed to analyze');
      } finally {
        setIsLoading(false);
      }
    },
    [chatLog, focusArea, requireKey, reportError]
  );

  return (
    <ToolLayout toolName="AI Chat Analyzer" toolIcon={<Insights />} toolColor="#f59e0b">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <APIKeyInput />
            <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Analytics color="warning" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Paste Chat Log
                </Typography>
              </Box>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={5}
                placeholder="User: Hello\nBot: Hi! How can I help?..."
                value={chatLog}
                onChange={(e) => {
                  setChatLog(e.target.value);
                  setIsContentSet(false);
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                select
                size="small"
                label="Focus Area (Optional)"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                sx={{ mb: 2 }}
              >
                {focusAreas.map((area) => (
                  <MenuItem key={area.value} value={area.value}>
                    {area.label}
                  </MenuItem>
                ))}
              </TextField>
              <Button
                fullWidth
                variant="contained"
                color="warning"
                onClick={handleSetContent}
                disabled={chatLog.trim().length < 50}
                startIcon={isContentSet ? <CheckCircle /> : <Insights />}
              >
                {isContentSet ? 'Ready to Analyze' : 'Set Chat Log'}
              </Button>
              {isContentSet && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Chat log set! ({chatLog.length} chars)
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
                  Analysis Chat
                </Typography>
              </Box>
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <ChatMessages messages={messages} tokenUsage={tokenUsage} />
              </Box>
              <ChatInput
                onSend={handleSendMessage}
                isLoading={isLoading}
                disabled={!isContentSet}
                placeholder="Ask about this chat log (e.g., What are the main issues?)"
              />
            </Paper>
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert
                  secretKey={OPENAI_SECRET_KEY}
                  hint="The analysis runs through OpenAI with your own key; the chat log stays in this browser."
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

export default AIChatAnalyzer;
