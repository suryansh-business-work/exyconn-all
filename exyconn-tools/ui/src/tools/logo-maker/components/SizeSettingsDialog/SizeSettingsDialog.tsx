import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Chip } from '@mui/material';
import { RestartAlt, ContentCopy } from '@mui/icons-material';
import { LogoSettings, DEFAULT_SETTINGS } from '../../types';
import TransformControls from './TransformControls';
import AppearanceControls from './AppearanceControls';

interface Props {
  open: boolean;
  onClose: () => void;
  sizeLabel: string;
  settings: LogoSettings;
  onSave: (settings: LogoSettings) => void;
  onReset: () => void;
  hasCustomSettings?: boolean | undefined;
  globalSettings?: LogoSettings | undefined;
}

const SizeSettingsDialog: React.FC<Props> = ({
  open,
  onClose,
  sizeLabel,
  settings,
  onSave,
  onReset,
  hasCustomSettings,
  globalSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<LogoSettings>(settings);

  useEffect(() => {
    if (open) {
      setLocalSettings(settings);
    }
  }, [open, settings]);

  const update = (key: keyof LogoSettings, value: number | string | boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(localSettings);
  };

  const handleReset = () => {
    setLocalSettings(globalSettings || DEFAULT_SETTINGS);
    onReset();
  };

  const handleCopyFromGlobal = () => {
    if (globalSettings) {
      setLocalSettings(globalSettings);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            ⚙️ {sizeLabel}
          </Typography>
          {hasCustomSettings && (
            <Chip label="Custom" size="small" color="success" sx={{ height: 18, fontSize: '0.6rem' }} />
          )}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <Button
            size="small"
            startIcon={<RestartAlt sx={{ fontSize: 14 }} />}
            onClick={handleReset}
            color="warning"
            variant="outlined"
            fullWidth
          >
            Reset to Global
          </Button>
          <Button
            size="small"
            startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
            onClick={handleCopyFromGlobal}
            variant="outlined"
            fullWidth
          >
            Copy Global
          </Button>
        </Box>

        <TransformControls settings={localSettings} onUpdate={update} />
        <AppearanceControls settings={localSettings} onUpdate={update} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} size="small">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" size="small">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SizeSettingsDialog;
