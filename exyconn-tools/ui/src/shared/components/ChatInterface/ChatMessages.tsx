import React, { useRef, useEffect } from 'react';
import { Box, Paper, Typography, Avatar, Chip, Stack } from '@mui/material';
import { Person, SmartToy, Token } from '@mui/icons-material';
import { ChatMessage, TokenUsage } from './types';

interface ChatMessagesProps {
  messages: ChatMessage[];
  tokenUsage?: TokenUsage;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, tokenUsage }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
        <Typography color="text.secondary" variant="body2">
          Start a conversation by asking a question...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      {messages.map((msg) => (
        <Box
          key={msg.id}
          sx={{
            display: 'flex',
            gap: 1.5,
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
            }}
          >
            {msg.role === 'user' ? <Person sx={{ fontSize: 18 }} /> : <SmartToy sx={{ fontSize: 18 }} />}
          </Avatar>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              maxWidth: '75%',
              bgcolor: msg.role === 'user' ? 'primary.main' : 'grey.100',
              color: msg.role === 'user' ? 'white' : 'text.primary',
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {msg.content}
            </Typography>
          </Paper>
        </Box>
      ))}
      {tokenUsage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Token sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Chip
              label={`In: ${tokenUsage.promptTokens}`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: 11 }}
            />
            <Chip
              label={`Out: ${tokenUsage.completionTokens}`}
              size="small"
              variant="outlined"
              sx={{ height: 20, fontSize: 11 }}
            />
            <Chip
              label={`Total: ${tokenUsage.totalTokens}`}
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: 11 }}
            />
          </Stack>
        </Box>
      )}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessages;
