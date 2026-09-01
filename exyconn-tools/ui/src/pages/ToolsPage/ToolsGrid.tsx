import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { ToolsGridProps } from './types';
import ToolCard from './ToolCard';

const ToolsGrid: React.FC<Readonly<ToolsGridProps>> = ({ category, onToolClick }) => (
  <Box>
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5,
      pb: 1, borderBottom: 1, borderColor: 'divider',
    }}>
      <Box sx={{
        width: 32, height: 32, borderRadius: 1, bgcolor: `${category.color}12`, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Box component={category.icon} sx={{ width: 18, height: 18, color: category.color }} />
      </Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '0.95rem' }}>
        {category.category}
      </Typography>
      <Chip label={category.items.length} size="small"
        sx={{ height: 20, fontSize: '0.75rem', fontWeight: 600 }} />
    </Box>

    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
      gap: 1.5,
    }}>
      {category.items.map((tool) => (
        <ToolCard key={tool.id} tool={tool} onToolClick={onToolClick} />
      ))}
    </Box>
  </Box>
);

export default ToolsGrid;
