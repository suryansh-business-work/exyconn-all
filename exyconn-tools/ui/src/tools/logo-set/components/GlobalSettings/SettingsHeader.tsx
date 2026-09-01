import React from 'react';
import { Box, Typography, Tooltip, Button } from '@mui/material';
import { Tune, RestartAlt } from '@mui/icons-material';
import { SettingsHeaderProps } from './types';

const SettingsHeader: React.FC<SettingsHeaderProps> = ({ hasCustomChanges, onReset }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Tune sx={{ fontSize: 18 }} color="primary" />
      <Typography variant="subtitle2" fontWeight={600}>
        Settings
      </Typography>
    </Box>
    <Tooltip title={hasCustomChanges ? 'Reset (Custom changes exist)' : 'Reset to defaults'}>
      <Button
        size="small"
        startIcon={<RestartAlt sx={{ fontSize: 16 }} />}
        onClick={onReset}
        color={hasCustomChanges ? 'warning' : 'inherit'}
        sx={{ fontSize: '0.7rem', py: 0.25 }}
      >
        Reset
      </Button>
    </Tooltip>
  </Box>
);

export default SettingsHeader;
