import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { readSecret, writeSecret } from '../../services/secrets';

interface SecretsDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Secret key to expand, scroll to and highlight when the drawer opens. */
  highlightKey?: string;
}

const SecretsDrawer: React.FC<Readonly<SecretsDrawerProps>> = ({ open, onClose, highlightKey }) => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const highlightRef = useRef<HTMLDivElement | null>(null);

  const loadValues = useCallback(() => {
    const loaded: Record<string, string> = {};
    const savedState: Record<string, boolean> = {};
    secretsConfig.forEach((field) => {
      loaded[field.key] = readSecret(field.key);
      savedState[field.key] = !!loaded[field.key];
    });
    setValues(loaded);
    setSaved(savedState);
  }, []);

  useEffect(() => {
    if (open) loadValues();
  }, [open, loadValues]);

  // When a tool sends the user here for a specific key, bring that field into
  // view so the pulse ring is actually visible rather than below the fold.
  useEffect(() => {
    if (!open || !highlightKey) {
      return undefined;
    }
    const timer = setTimeout(() => {
      highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 260);
    return () => clearTimeout(timer);
  }, [open, highlightKey]);

  const handleSave = (field: SecretField) => {
    const value = values[field.key] || '';
    writeSecret(field.key, value);
    setSaved((prev) => ({ ...prev, [field.key]: !!value }));
  };

  const handleClear = (field: SecretField) => {
    setValues((prev) => ({ ...prev, [field.key]: '' }));
    writeSecret(field.key, '');
    setSaved((prev) => ({ ...prev, [field.key]: false }));
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(values[key] || '');
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const configuredCount = Object.values(saved).filter(Boolean).length;
  const highlightField = highlightKey
    ? secretsConfig.find((field) => field.key === highlightKey)
    : undefined;
  const highlightCategory = highlightField?.category;

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
        {highlightField ? (
          <Alert severity="warning" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
            Paste your <strong>{highlightField.label}</strong> in the highlighted field below,
            then press Save. Steps to get one are in that card.
          </Alert>
        ) : (
          <Alert severity="info" variant="outlined" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.8rem' } }}>
            Keys are stored locally in your browser. They are never sent to our servers.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {secretCategories.map((category) => (
            <Accordion
              key={category}
              defaultExpanded
              expanded={highlightCategory === category ? true : undefined}
              disableGutters
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
                    <Box
                      key={field.key}
                      ref={field.key === highlightKey ? highlightRef : undefined}
                      sx={
                        field.key === highlightKey
                          ? {
                              borderRadius: 2,
                              outline: 2,
                              outlineColor: 'warning.main',
                              outlineOffset: 4,
                              animation: 'secretPulse 1.4s ease-out 3',
                              '@keyframes secretPulse': {
                                '0%, 100%': { outlineColor: 'transparent' },
                                '50%': { outlineColor: 'warning.main' },
                              },
                            }
                          : undefined
                      }
                    >
                    <SecretFieldItem
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
                    </Box>
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
