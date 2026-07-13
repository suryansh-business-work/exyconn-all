import React, { useState, useCallback } from 'react';
import { Container, Alert, Snackbar, Paper, Box, Typography, Button, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Article, CloudUpload } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput } from '../../shared/components/AIToolShared';
import { ChatMessages, ChatInput, ChatMessage, TokenUsage } from '../../shared/components/ChatInterface';
import { useOpenAI } from '../../shared/context/OpenAIContext';
import { generateWithOpenAI } from '../../shared/services/openai';
import { APIs } from '../../shared/config/apis';

const SYSTEM_PROMPT = `You are an AI assistant that answers questions about Word document content. Be accurate and helpful, reference specific parts when needed.`;

const ChatWithWord: React.FC = () => {
  const { apiKey, isKeySet } = useOpenAI();
  const [fileName, setFileName] = useState('');
  const [wordContent, setWordContent] = useState('');
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoadingContent(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch(APIs.chatTools.extractDocument, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileData: base64, mimeType: file.type, fileName: file.name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to extract');
        setWordContent(data.text);
        setFileName(file.name);
        setMessages([]);
        setIsLoadingContent(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract Word document');
      setIsLoadingContent(false);
    }
  };

  const handleSendMessage = useCallback(
    async (question: string) => {
      if (!apiKey || !wordContent) return;
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      try {
        const userPrompt = `Word Document Content:\n${wordContent.substring(0, 12000)}\n\nQuestion: ${question}`;
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
        setError(err instanceof Error ? err.message : 'Failed to generate');
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, wordContent]
  );

  return (
    <ToolLayout toolName="Chat With Word Files" toolIcon={<Article />} toolColor="#0ea5e9">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <APIKeyInput />
            <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Article color="info" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Upload Word Document
                </Typography>
              </Box>
              <Button
                component="label"
                fullWidth
                variant="outlined"
                color="info"
                startIcon={isLoadingContent ? <CircularProgress size={18} /> : <CloudUpload />}
                sx={{ mb: 1 }}
              >
                {isLoadingContent ? 'Extracting...' : 'Choose Word File'}
                <input type="file" hidden accept=".doc,.docx" onChange={handleFileUpload} />
              </Button>
              <Typography variant="caption" color="text.secondary">
                Supports: DOC, DOCX files
              </Typography>
              {fileName && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {fileName} loaded! ({wordContent.length} chars)
                </Alert>
              )}
              {!isKeySet && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Add OpenAI API key to chat.
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
                disabled={!wordContent || !isKeySet}
                placeholder="Ask about this document..."
              />
            </Paper>
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

export default ChatWithWord;
