import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { Build, RocketLaunch, Apps } from '@mui/icons-material';
import { StatsBarProps } from './types';

const StatsBar: React.FC<StatsBarProps> = ({
  totalTools, availableTools, comingSoonTools, statusFilter, onStatusFilterChange,
}) => {
  const filters = [
    { key: 'all' as const, label: `All Tools (${totalTools})`, icon: <Apps sx={{ fontSize: '14px !important' }} /> },
    { key: 'available' as const, label: `Available (${availableTools})`, icon: <Build sx={{ fontSize: '14px !important' }} /> },
    { key: 'coming-soon' as const, label: `Coming Soon (${comingSoonTools})`, icon: <RocketLaunch sx={{ fontSize: '14px !important' }} /> },
  ];

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5,
      mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider',
    }}>
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ fontSize: '0.8rem' }}>
        Filter by status:
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
        {filters.map((f) => (
          <Chip key={f.key} icon={f.icon} label={f.label} size="small"
            variant={statusFilter === f.key ? 'filled' : 'outlined'}
            color={statusFilter === f.key ? 'primary' : 'default'}
            onClick={() => onStatusFilterChange(f.key)}
            sx={{
              fontSize: '0.75rem', fontWeight: statusFilter === f.key ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default StatsBar;
