import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer, Box, Typography, IconButton, Chip,
  Alert, Accordion, AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Close, Key, CheckCircle, ExpandMore,
} from '@mui/icons-material';
import { secretsConfig, secretCategories, SecretField } from './secretsConfig';
import SecretFieldItem from './SecretFieldItem';

interface SecretsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const SecretsDrawer: React.FC<SecretsDrawerProps> = ({ open, onClose }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const loadValues = useCallback(() => {
    const loaded: Record<string, string> = {};
    const savedState: Record<string, boolean> = {};
    secretsConfig.forEach((field) => {
      if (field.key === 'google_maps_api_key' || field.key === 'google_places_api_key') {
        const stored = localStorage.getItem(field.storageKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            loaded[field.key] =
              field.key === 'google_maps_api_key' ? parsed.googleMapsApiKey || '' : parsed.googlePlacesApiKey || '';
            savedState[field.key] = !!loaded[field.key];
          } catch {
            loaded[field.key] = '';
          }
        }
      } else {
        loaded[field.key] = localStorage.getItem(field.storageKey) || '';
        savedState[field.key] = !!loaded[field.key];
      }
    });
    setValues(loaded);
    setSaved(savedState);
  }, []);

  useEffect(() => {
    if (open) loadValues();
  }, [open, loadValues]);

  const handleSave = (field: SecretField) => {
    const value = values[field.key] || '';
    if (field.key === 'google_maps_api_key' || field.key === 'google_places_api_key') {
      const stored = localStorage.getItem(field.storageKey);
      let parsed: Record<string, string> = { googleMapsApiKey: '', googlePlacesApiKey: '' };
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch {
          /* ignore */
        }
      }
      if (field.key === 'google_maps_api_key') parsed.googleMapsApiKey = value;
      else parsed.googlePlacesApiKey = value;
      localStorage.setItem(field.storageKey, JSON.stringify(parsed));
    } else {
      if (value) localStorage.setItem(field.storageKey, value);
      else localStorage.removeItem(field.storageKey);
    }
    setSaved((prev) => ({ ...prev, [field.key]: !!value }));
  };

  const handleClear = (field: SecretField) => {
    setValues((prev) => ({ ...prev, [field.key]: '' }));
    if (field.key === 'google_maps_api_key' || field.key === 'google_places_api_key') {
      const stored = localStorage.getItem(field.storageKey);
      let parsed: Record<string, string> = { googleMapsApiKey: '', googlePlacesApiKey: '' };
      if (stored) {
        try {
          parsed = JSON.parse(stored);
        } catch {
          /* ignore */
        }
      }
      if (field.key === 'google_maps_api_key') parsed.googleMapsApiKey = '';
      else parsed.googlePlacesApiKey = '';
      localStorage.setItem(field.storageKey, JSON.stringify(parsed));
    } else {
      localStorage.removeItem(field.storageKey);
    }
    setSaved((prev) => ({ ...prev, [field.key]: false }));
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(values[key] || '');
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const configuredCount = Object.values(saved).filter(Boolean).length;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, bgcolor: 'background.default', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' } }}>
      {/* Header - fixed at top */}
      <Box sx={{ flexShrink: 0, px: 2.5, py: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Key sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography variant="h6" fontWeight={700} fontSize={16}>API Keys & Secrets</Typography>
          </Box>
          <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Configure your API keys once — they auto-apply across all tools.
        </Typography>
        <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
          <Chip size="small" icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
            label={`${configuredCount}/${secretsConfig.length} configured`}
            color={configuredCount === secretsConfig.length ? 'success' : 'default'}
            variant="outlined" sx={{ fontSize: '0.75rem' }} />
        </Box>
      </Box>

      {/* Scrollable Content */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 2.5, py: 2, minHeight: 0 }}>
        <Alert severity="info" variant="outlined" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
          Keys are stored locally in your browser. They are never sent to our servers.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {secretCategories.map((category) => (
            <Accordion key={category} defaultExpanded disableGutters
              sx={{ 
                '&:before': { display: 'none' }, 
                bgcolor: 'background.paper', 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: '8px !important',
                overflow: 'visible',
                boxShadow: 'none',
              }}>
              <AccordionSummary 
                expandIcon={<ExpandMore />} 
                sx={{ 
                  minHeight: 44, 
                  '& .MuiAccordionSummary-content': { my: 0.5 },
                  borderRadius: '8px',
                }}>
                <Typography variant="subtitle2" fontWeight={600} fontSize={13}>{category}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, pb: 2, px: 2, overflow: 'visible' }}>
                {secretsConfig
                  .filter((f) => f.category === category)
                  .map((field) => (
                    <SecretFieldItem
                      key={field.key}
                      field={field}
                      value={values[field.key] || ''}
                      isVisible={!!visibility[field.key]}
                      isSaved={!!saved[field.key]}
                      isCopied={copied === field.key}
                      onValueChange={(val) => setValues((prev) => ({ ...prev, [field.key]: val }))}
                      onToggleVisibility={() => setVisibility((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                      onSave={() => handleSave(field)}
                      onClear={() => handleClear(field)}
                      onCopy={() => handleCopy(field.key)}
                    />
                  ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>
    </Drawer>
  );
};

export default SecretsDrawer;
