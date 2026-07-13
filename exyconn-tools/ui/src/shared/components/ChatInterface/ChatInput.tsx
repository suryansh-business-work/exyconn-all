import React, { useState } from 'react';
import { Box, TextField, IconButton, CircularProgress } from '@mui/material';
import { Send } from '@mui/icons-material';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  isLoading,
  disabled,
  placeholder = 'Type your question...',
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: 'flex', gap: 1, p: 2, borderTop: 1, borderColor: 'divider' }}
    >
      <TextField
        fullWidth
        size="small"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        disabled={isLoading || disabled}
        autoComplete="off"
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
      />
      <IconButton
        type="submit"
        color="primary"
        disabled={!input.trim() || isLoading || disabled}
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': { bgcolor: 'primary.dark' },
          '&:disabled': { bgcolor: 'grey.300' },
        }}
      >
        {isLoading ? <CircularProgress size={20} color="inherit" /> : <Send />}
      </IconButton>
    </Box>
  );
};

export default ChatInput;
