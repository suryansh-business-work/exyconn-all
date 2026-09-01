import React from 'react';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText, Typography, Chip, Paper,
} from '@mui/material';
import { Apps } from '@mui/icons-material';
import { toolsData, getToolCounts } from '../../shared/data/toolsData';
import { CategorySelectProps } from './types';

const countChipSx = { height: 20, fontSize: '0.75rem', fontWeight: 600 };

const CategorySidebar: React.FC<Readonly<CategorySelectProps>> = ({
  selectedCategory, onCategoryChange,
}) => {
  const { total } = getToolCounts();
  const allSelected = selectedCategory === 'All';

  return (
    <Paper sx={{ p: 1, border: 1, borderColor: 'divider', position: 'sticky', top: 68 }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary"
        sx={{ px: 1.5, py: 1, display: 'block' }}>
        CATEGORIES
      </Typography>

      <List dense disablePadding>
        <ListItemButton selected={allSelected} onClick={() => onCategoryChange('All')}
          sx={{ borderRadius: 1, mb: 0.25, minHeight: 40 }}>
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Apps sx={{ fontSize: 18, color: allSelected ? 'primary.main' : 'text.secondary' }} />
          </ListItemIcon>
          <ListItemText primary="All Tools"
            slotProps={{ primary: { fontSize: '0.8rem', fontWeight: allSelected ? 700 : 500 } }} />
          <Chip label={total} size="small" sx={countChipSx} />
        </ListItemButton>

        {toolsData.map((cat) => {
          const isSelected = selectedCategory === cat.category;
          return (
            <ListItemButton key={cat.category} selected={isSelected}
              onClick={() => onCategoryChange(cat.category)}
              sx={{ borderRadius: 1, mb: 0.25, minHeight: 40 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <Box component={cat.icon}
                  sx={{ width: 16, height: 16, color: isSelected ? cat.color : 'text.secondary' }} />
              </ListItemIcon>
              <ListItemText primary={cat.category}
                slotProps={{ primary: {
                  fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, noWrap: true,
                } }} />
              <Chip label={cat.items.length} size="small" sx={countChipSx} />
            </ListItemButton>
          );
        })}
      </List>
    </Paper>
  );
};

export default CategorySidebar;
