import React, { useState } from 'react';
import { Box, TextField, Button, Paper, Typography, InputAdornment, IconButton, Alert } from '@mui/material';
import { Key, Visibility, VisibilityOff, Delete, CheckCircle } from '@mui/icons-material';
import { useOpenAI } from '../../context/OpenAIContext';
import { readSecret, writeSecret } from '../../services/secrets';
import { OPENAI_SECRET_KEY } from '../../services/openai';

/**
 * Inline editor for the OpenAI key shared by every AI tool.
 *
 * Storage goes through the secrets module so this panel and the secrets drawer
 * always show the same key; the OpenAI context is kept in step only so the
 * tools-list "key configured" badge still reacts to a save made here.
 */
const APIKeyInput: React.FC = () => {
  const { setApiKey: rememberKey, clearApiKey: forgetKey } = useOpenAI();
  const [apiKey, setStoredKey] = useState(() => readSecret(OPENAI_SECRET_KEY));
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    const value = inputValue.trim();
    if (!value) {
      return;
    }
    writeSecret(OPENAI_SECRET_KEY, value);
    setStoredKey(value);
    rememberKey(value);
    setInputValue('');
  };

  const handleClear = () => {
    writeSecret(OPENAI_SECRET_KEY, '');
    setStoredKey('');
    forgetKey();
  };

  const isKeySet = apiKey.length > 0;
  const maskedKey = isKeySet ? `sk-...${apiKey.slice(-8)}` : '';

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
          <IconButton size="small" color="error" onClick={handleClear} title="Remove API Key">
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
