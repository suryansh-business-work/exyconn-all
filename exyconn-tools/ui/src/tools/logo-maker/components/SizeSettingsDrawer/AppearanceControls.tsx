import React from 'react';
import { Box, Typography, Switch, FormControlLabel, TextField } from '@mui/material';
import { Layers, Palette } from '@mui/icons-material';
import { LogoSettings } from '../../types';

interface AppearanceControlsProps {
  settings: LogoSettings;
  onUpdate: (key: keyof LogoSettings, value: string | boolean) => void;
}

const AppearanceControls: React.FC<AppearanceControlsProps> = ({ settings, onUpdate }) => (
  <>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
      <Layers sx={{ fontSize: 16 }} color="action" />
      <FormControlLabel
        control={
          <Switch
            checked={settings.transparent}
            onChange={(e) => onUpdate('transparent', e.target.checked)}
            size="small"
          />
        }
        label={<Typography variant="caption">Transparent Background</Typography>}
        sx={{ flex: 1, m: 0 }}
      />
    </Box>

    {!settings.transparent && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Palette sx={{ fontSize: 16 }} color="action" />
        <TextField
          type="color"
          value={settings.backgroundColor}
          onChange={(e) => onUpdate('backgroundColor', e.target.value)}
          size="small"
          sx={{ width: 50, '& input': { p: 0.5, cursor: 'pointer', height: 28 } }}
        />
        <Typography variant="caption" color="text.secondary" fontFamily="monospace">
          {settings.backgroundColor}
        </Typography>
      </Box>
    )}
  </>
);

export default AppearanceControls;
