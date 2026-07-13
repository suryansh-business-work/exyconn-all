import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  Collapse,
  Divider,
} from '@mui/material';
import { Settings, Visibility, VisibilityOff, Save, Warning, Key, ExpandMore, ExpandLess } from '@mui/icons-material';
import { APISettings, STORAGE_KEYS } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface APISettingsDialogProps {
  onSettingsChange?: (settings: APISettings) => void;
}

const APISettingsPanel: React.FC<APISettingsDialogProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useLocalStorage<APISettings>(STORAGE_KEYS.API_SETTINGS, {
    googleMapsApiKey: '',
    googlePlacesApiKey: '',
  });
  const [showMapsKey, setShowMapsKey] = useState(false);
  const [showPlacesKey, setShowPlacesKey] = useState(false);
  const [expanded, setExpanded] = useState(!settings.googleMapsApiKey);
  const [tempSettings, setTempSettings] = useState(settings);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSettings(tempSettings);
    onSettingsChange?.(tempSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasKeys = settings.googleMapsApiKey && settings.googlePlacesApiKey;

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          bgcolor: hasKeys ? 'success.50' : 'warning.50',
          '&:hover': { bgcolor: hasKeys ? 'success.100' : 'warning.100' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings fontSize="small" color={hasKeys ? 'success' : 'warning'} />
          <Typography variant="subtitle2" fontWeight={600}>
            API Settings
          </Typography>
          {hasKeys && (
            <Typography variant="caption" color="success.main">
              ✓ Configured
            </Typography>
          )}
        </Box>
        <IconButton size="small">{expanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 5 }}>
            <Typography variant="body2" fontWeight={600}>
              ⚠️ MVP Tool - Local Storage Only
            </Typography>
            <Typography variant="caption">
              This is an MVP version. Your API keys are stored locally in your browser's localStorage. They are NOT sent
              to any server and remain on your device only. Do not share your browser data.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Google Maps API Key"
              type={showMapsKey ? 'text' : 'password'}
              value={tempSettings.googleMapsApiKey}
              onChange={(e) => setTempSettings({ ...tempSettings, googleMapsApiKey: e.target.value })}
              placeholder="AIza..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Key fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowMapsKey(!showMapsKey)}>
                      {showMapsKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="Google Places API Key"
              type={showPlacesKey ? 'text' : 'password'}
              value={tempSettings.googlePlacesApiKey}
              onChange={(e) => setTempSettings({ ...tempSettings, googlePlacesApiKey: e.target.value })}
              placeholder="AIza..."
              helperText="Can be the same as Maps API key if Places is enabled"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Key fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPlacesKey(!showPlacesKey)}>
                      {showPlacesKey ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Get your API keys from{' '}
                <a href="https://console.cloud.google.com/apis" target="_blank" rel="noopener noreferrer">
                  Google Cloud Console
                </a>
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<Save />}
                onClick={handleSave}
                color={saved ? 'success' : 'primary'}
              >
                {saved ? 'Saved!' : 'Save Keys'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default APISettingsPanel;
