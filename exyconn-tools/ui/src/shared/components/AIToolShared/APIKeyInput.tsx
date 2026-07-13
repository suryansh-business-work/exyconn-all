import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, InputAdornment, IconButton, Alert } from '@mui/material';
import { Key, Visibility, VisibilityOff, Delete, CheckCircle } from '@mui/icons-material';
import { useOpenAI } from '../../context/OpenAIContext';

const APIKeyInput: React.FC = () => {
  const { apiKey, setApiKey, clearApiKey, isKeySet } = useOpenAI();
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    if (inputValue.trim()) {
      setApiKey(inputValue.trim());
      setInputValue('');
    }
  };

  const maskedKey = apiKey ? `sk-...${apiKey.slice(-8)}` : '';

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Key fontSize="small" color="action" />
        <Typography variant="subtitle2" fontWeight={600}>
          OpenAI API Key
        </Typography>
      </Box>

      {isKeySet ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Alert severity="success" icon={<CheckCircle fontSize="small" />} sx={{ flex: 1, py: 0.5 }}>
            API Key saved: {maskedKey}
          </Alert>
          <IconButton size="small" color="error" onClick={clearApiKey} title="Remove API Key">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            type={showKey ? 'text' : 'password'}
            placeholder="sk-..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" size="small" onClick={handleSave} disabled={!inputValue.trim()}>
            Save
          </Button>
        </Box>
      )}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Your API key is stored locally in your browser and never sent to our servers.
      </Typography>
    </Paper>
  );
};

export default APIKeyInput;
