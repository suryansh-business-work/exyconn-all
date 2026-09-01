import React, { useState, useCallback } from 'react';
import { Container, Alert, Snackbar, Paper, Box, Typography, Button, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { Description, CloudUpload } from '@mui/icons-material';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import { APIKeyInput, useOpenAIKey, OPENAI_SECRET_KEY } from '../../shared/components/AIToolShared';
import MissingKeyAlert from '../../shared/components/MissingKeyAlert/MissingKeyAlert';
import { ChatMessages, ChatInput, ChatMessage, TokenUsage } from '../../shared/components/ChatInterface';
import { generateWithOpenAI } from '../../shared/services/openai';
import { APIs } from '../../shared/config/apis';

const SYSTEM_PROMPT = `You are an AI assistant that answers questions about document content. Be thorough, accurate, and summarize key points when helpful.`;

const ChatWithDocuments: React.FC = () => {
  const { needsKey, requireKey, reportError } = useOpenAIKey();
  const [fileName, setFileName] = useState('');
  const [documentContent, setDocumentContent] = useState('');
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
        setDocumentContent(data.text);
        setFileName(file.name);
        setMessages([]);
        setIsLoadingContent(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract document');
      setIsLoadingContent(false);
    }
  };

  const handleSendMessage = useCallback(
    async (question: string) => {
      if (!documentContent) return;
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
        const userPrompt = `Document Content:\n${documentContent.substring(0, 12000)}\n\nQuestion: ${question}`;
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
    [documentContent, requireKey, reportError]
  );

  return (
    <ToolLayout toolName="Chat With Documents" toolIcon={<Description />} toolColor="#22c55e">
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <APIKeyInput />
            <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CloudUpload color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Upload Document
                </Typography>
              </Box>
              <Button
                component="label"
                fullWidth
                variant="outlined"
                startIcon={isLoadingContent ? <CircularProgress size={18} /> : <CloudUpload />}
                sx={{ mb: 1 }}
              >
                {isLoadingContent ? 'Extracting...' : 'Choose File'}
                <input type="file" hidden accept=".txt,.doc,.docx,.pdf" onChange={handleFileUpload} />
              </Button>
              <Typography variant="caption" color="text.secondary">
                Supports: TXT, DOC, DOCX, PDF
              </Typography>
              {fileName && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {fileName} loaded! ({documentContent.length} chars)
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
                disabled={!documentContent}
                placeholder="Ask about this document..."
              />
            </Paper>
            {needsKey && (
              <Box sx={{ mt: 2 }}>
                <MissingKeyAlert
                  secretKey={OPENAI_SECRET_KEY}
                  hint="Answers about your document come from OpenAI using your own key."
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

export default ChatWithDocuments;
