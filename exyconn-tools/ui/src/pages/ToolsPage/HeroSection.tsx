import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Build, RocketLaunch, Apps } from '@mui/icons-material';
import { HeroSectionProps } from './types';

const HeroSection: React.FC<HeroSectionProps> = ({
  title, subtitle, totalTools, availableTools, comingSoonTools,
}) => (
  <Box sx={{ textAlign: 'center', mb: 3 }}>
    <Typography variant="h3" sx={{
      fontWeight: 800, color: 'text.primary', mb: 1,
      fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
    }}>
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{
      maxWidth: 600, mx: 'auto', mb: 2, fontSize: { xs: '0.9rem', sm: '1rem' },
    }}>
      {subtitle}
    </Typography>
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      <Chip icon={<Apps sx={{ fontSize: '16px !important' }} />}
        label={`${totalTools} Total Tools`} variant="outlined"
        sx={{ fontWeight: 600, fontSize: '0.8rem' }} />
      <Chip icon={<Build sx={{ fontSize: '16px !important' }} />}
        label={`${availableTools} Available`} color="success" variant="outlined"
        sx={{ fontWeight: 600, fontSize: '0.8rem' }} />
      <Chip icon={<RocketLaunch sx={{ fontSize: '16px !important' }} />}
        label={`${comingSoonTools} Coming Soon`} color="warning" variant="outlined"
        sx={{ fontWeight: 600, fontSize: '0.8rem' }} />
    </Box>
  </Box>
);

export default HeroSection;
