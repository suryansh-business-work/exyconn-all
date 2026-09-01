import React from 'react';
import { Box, Switch, FormControlLabel, Typography, Divider, Chip } from '@mui/material';
import { Layers } from '@mui/icons-material';
import { LogoSettings } from '../../types';

interface TransparencyToggleProps {
  transparent: boolean;
  onUpdate: (key: keyof LogoSettings, value: boolean) => void;
}

const TransparencyToggle: React.FC<TransparencyToggleProps> = ({ transparent, onUpdate }) => {
  return (
    <>
      <Divider sx={{ my: 1 }}>
        <Chip label="Appearance" size="small" sx={{ fontSize: '0.65rem' }} />
      </Divider>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
        <Layers sx={{ fontSize: 16 }} color="action" />
        <FormControlLabel
          control={
            <Switch checked={transparent} onChange={(e) => onUpdate('transparent', e.target.checked)} size="small" />
          }
          label={<Typography variant="caption">Transparent BG</Typography>}
          sx={{ flex: 1, m: 0 }}
        />
      </Box>
    </>
  );
};

export default TransparencyToggle;
