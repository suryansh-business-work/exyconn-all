import React from 'react';
import { Box, Chip } from '@mui/material';
import { Apps } from '@mui/icons-material';
import { toolsData } from '../../shared/data/toolsData';
import { CategorySelectProps } from './types';

const chipSx = {
  fontSize: '0.75rem', fontWeight: 600, flexShrink: 0,
  '& .MuiChip-icon': { fontSize: 14, width: 14, height: 14 },
};

/** Horizontally scrollable category selector shown on mobile instead of the sidebar. */
const CategoryChipRow: React.FC<Readonly<CategorySelectProps>> = ({
  selectedCategory, onCategoryChange,
}) => (
  <Box sx={{
    position: 'sticky', top: 56, zIndex: 1,
    bgcolor: 'background.default', borderBottom: 1, borderColor: 'divider',
    display: 'flex', gap: 0.75, px: 2, py: 1, overflowX: 'auto',
    scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
  }}>
    <Chip icon={<Apps />} label="All" size="small" onClick={() => onCategoryChange('All')}
      variant={selectedCategory === 'All' ? 'filled' : 'outlined'}
      color={selectedCategory === 'All' ? 'primary' : 'default'} sx={chipSx} />
    {toolsData.map((cat) => {
      const isSelected = selectedCategory === cat.category;
      return (
        <Chip key={cat.category} label={cat.category} size="small"
          icon={<Box component={cat.icon} />}
          onClick={() => onCategoryChange(cat.category)}
          variant={isSelected ? 'filled' : 'outlined'}
          color={isSelected ? 'primary' : 'default'} sx={chipSx} />
      );
    })}
  </Box>
);

export default CategoryChipRow;
