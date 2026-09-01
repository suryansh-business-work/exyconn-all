import React from 'react';
import {
  Drawer, Box, Typography, Divider, Chip, Button, IconButton,
} from '@mui/material';
import { RestartAlt, ContentCopy, Close } from '@mui/icons-material';
import { LogoSettings, DEFAULT_SETTINGS } from '../../types';
import TransformControls from './TransformControls';
import AppearanceControls from './AppearanceControls';

interface Props {
  open: boolean;
  onClose: () => void;
  sizeLabel: string;
  settings: LogoSettings;
  onChange: (settings: LogoSettings) => void;
  onReset: () => void;
  hasCustomSettings?: boolean;
  globalSettings?: LogoSettings;
  isIcon?: boolean;
}

const SizeSettingsDrawer: React.FC<Props> = ({
  open, onClose, sizeLabel, settings, onChange, onReset,
  hasCustomSettings, globalSettings, isIcon = false,
}) => {
  const update = (key: keyof LogoSettings, value: number | string | boolean) => {
    onChange({ ...settings, [key]: value });
  };

  const handleReset = () => {
    onChange(globalSettings || DEFAULT_SETTINGS);
    onReset();
  };

  const handleCopyFromGlobal = () => {
    if (globalSettings) {
      onChange(globalSettings);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 320, p: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            ⚙️ {sizeLabel}
          </Typography>
          {hasCustomSettings && (
            <Chip label="Custom" size="small" color="success" sx={{ height: 18, fontSize: '0.6rem' }} />
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button size="small" startIcon={<RestartAlt sx={{ fontSize: 14 }} />}
          onClick={handleReset} color="warning" variant="outlined" fullWidth>
          Reset
        </Button>
        <Button size="small" startIcon={<ContentCopy sx={{ fontSize: 14 }} />}
          onClick={handleCopyFromGlobal} variant="outlined" fullWidth>
          Copy Global
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }}>
        <Chip label="Transform" size="small" sx={{ fontSize: '0.65rem' }} />
      </Divider>

      <TransformControls
        settings={settings}
        onUpdate={(key, v) => update(key, v)}
        isIcon={isIcon}
      />

      <Divider sx={{ my: 2 }}>
        <Chip label="Appearance" size="small" sx={{ fontSize: '0.65rem' }} />
      </Divider>

      <AppearanceControls
        settings={settings}
        onUpdate={(key, v) => update(key, v)}
      />
    </Drawer>
  );
};

export default SizeSettingsDrawer;
