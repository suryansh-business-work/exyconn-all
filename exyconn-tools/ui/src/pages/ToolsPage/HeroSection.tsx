import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Apps, Category } from '@mui/icons-material';
import { HeroSectionProps } from './types';

const chipSx = { fontWeight: 600, fontSize: '0.8rem', '& .MuiChip-icon': { fontSize: 16 } };

const HeroSection: React.FC<Readonly<HeroSectionProps>> = ({
  title, subtitle, totalTools, categoryCount,
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
      <Chip icon={<Apps />} label={`${totalTools} Free Tools`} variant="outlined" sx={chipSx} />
      <Chip icon={<Category />} label={`${categoryCount} Categories`} variant="outlined" sx={chipSx} />
    </Box>
  </Box>
);

export default HeroSection;
