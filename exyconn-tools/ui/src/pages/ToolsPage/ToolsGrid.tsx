import React from 'react';
import { Box, Typography, Chip, Avatar } from '@mui/material';
import { ToolsGridProps } from './types';
import ToolCard from './ToolCard';

const ToolsGrid: React.FC<ToolsGridProps> = ({ category, onToolClick, onShowDescription }) => {
  const activeCount = category.items.filter((t) => t.isActive).length;
  const comingSoonCount = category.items.length - activeCount;

  return (
    <Box>
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5,
        pb: 1, borderBottom: 1, borderColor: 'divider',
      }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: `${category.color}12`, color: category.color, borderRadius: 1 }}>
          <category.icon sx={{ fontSize: 18 }} />
        </Avatar>
        <Typography variant="subtitle1" fontWeight={700} sx={{ fontSize: '0.95rem' }}>
          {category.category}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Chip label={`${category.items.length}`} size="small"
            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
          {comingSoonCount > 0 && (
            <Chip label={`${comingSoonCount} soon`} size="small" variant="outlined"
              sx={{ height: 20, fontSize: '0.65rem', color: 'text.secondary' }} />
          )}
        </Box>
      </Box>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 1.5,
      }}>
        {category.items.map((tool) => (
          <ToolCard key={tool.id} tool={tool} onToolClick={onToolClick} onShowDescription={onShowDescription} />
        ))}
      </Box>
    </Box>
  );
};

export default ToolsGrid;
