import React, { useState, useEffect } from 'react';
import {
  Box, Button,
  Typography, Chip, IconButton, Tooltip, TextField, InputAdornment,
  Collapse,
} from '@mui/material';
import { Key, Visibility, VisibilityOff, CheckCircle, Save, Settings } from '@mui/icons-material';
import { secretsConfig } from '../SecretsDrawer/secretsConfig';

export interface RequiredApiKey {
  key: string;
  label: string;
}

interface ApiKeySelectProps {
  requiredKeys: RequiredApiKey[];
  onOpenSecrets?: () => void;
}

const ApiKeySelect: React.FC<ApiKeySelectProps> = ({ requiredKeys, onOpenSecrets }) => {
  const [showInline, setShowInline] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loaded: Record<string, string> = {};
    const status: Record<string, boolean> = {};
    requiredKeys.forEach(({ key }) => {
      const field = secretsConfig.find((f) => f.key === key);
      if (!field) return;
      if (field.key === 'google_maps_api_key' || field.key === 'google_places_api_key') {
        const stored = localStorage.getItem(field.storageKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            loaded[key] = field.key === 'google_maps_api_key' ? parsed.googleMapsApiKey || '' : parsed.googlePlacesApiKey || '';
          } catch { loaded[key] = ''; }
        }
      } else {
        loaded[key] = localStorage.getItem(field.storageKey) || '';
      }
      status[key] = !!loaded[key];
    });
    setValues(loaded);
    setSavedStatus(status);
  }, [requiredKeys]);

  const handleSave = (key: string) => {
    const field = secretsConfig.find((f) => f.key === key);
    if (!field) return;
    const value = values[key] || '';
    if (field.key === 'google_maps_api_key' || field.key === 'google_places_api_key') {
      const stored = localStorage.getItem(field.storageKey);
      let parsed: Record<string, string> = { googleMapsApiKey: '', googlePlacesApiKey: '' };
      if (stored) { try { parsed = JSON.parse(stored); } catch { /* ignore */ } }
      if (field.key === 'google_maps_api_key') parsed.googleMapsApiKey = value;
      else parsed.googlePlacesApiKey = value;
      localStorage.setItem(field.storageKey, JSON.stringify(parsed));
    } else {
      if (value) localStorage.setItem(field.storageKey, value);
      else localStorage.removeItem(field.storageKey);
    }
    setSavedStatus((p) => ({ ...p, [key]: !!value }));
  };

  const configuredCount = Object.values(savedStatus).filter(Boolean).length;

  if (requiredKeys.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Key sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            Required API Keys
          </Typography>
          <Chip label={`${configuredCount}/${requiredKeys.length}`} size="small"
            color={configuredCount === requiredKeys.length ? 'success' : 'warning'}
            sx={{ height: 18, fontSize: '0.6rem' }} />
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Configure keys inline">
            <IconButton size="small" onClick={() => setShowInline(!showInline)}>
              <Settings sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          {onOpenSecrets && (
            <Button size="small" startIcon={<Key sx={{ fontSize: 14 }} />}
              onClick={onOpenSecrets}
              sx={{ fontSize: '0.7rem', textTransform: 'none', py: 0.25 }}>
              Manage Keys
            </Button>
          )}
        </Box>
      </Box>

      {/* Key status chips */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: showInline ? 1 : 0 }}>
        {requiredKeys.map(({ key, label }) => (
          <Chip key={key} size="small" variant="outlined"
            icon={savedStatus[key] ? <CheckCircle sx={{ fontSize: '12px !important' }} /> : <Key sx={{ fontSize: '12px !important' }} />}
            label={label}
            color={savedStatus[key] ? 'success' : 'default'}
            sx={{ fontSize: '0.65rem', height: 22 }} />
        ))}
      </Box>

      <Collapse in={showInline}>
        <Box sx={{ mt: 1, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          {requiredKeys.map(({ key, label }) => (
            <Box key={key} sx={{ mb: 1.5, '&:last-child': { mb: 0 } }}>
              <Typography variant="caption" fontWeight={600} sx={{ mb: 0.25, display: 'block' }}>{label}</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <TextField fullWidth size="small" placeholder="Enter API key..."
                  value={values[key] || ''} type={visibility[key] ? 'text' : 'password'}
                  onChange={(e) => setValues((p) => ({ ...p, [key]: e.target.value }))}
                  InputProps={{
                    sx: { fontSize: '0.75rem', fontFamily: 'monospace' },
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setVisibility((p) => ({ ...p, [key]: !p[key] }))}>
                          {visibility[key] ? <VisibilityOff sx={{ fontSize: 14 }} /> : <Visibility sx={{ fontSize: 14 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }} />
                <Button size="small" variant="contained" onClick={() => handleSave(key)}
                  sx={{ minWidth: 'auto', px: 1.5, fontSize: '0.7rem' }}>
                  <Save sx={{ fontSize: 14 }} />
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default ApiKeySelect;
