import React from 'react';
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Chip, Avatar, Paper, Collapse,
} from '@mui/material';
import { ExpandMore, ExpandLess, Apps } from '@mui/icons-material';
import { toolsData, ToolCategory } from '../../shared/data/toolsData';

interface CategorySidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({ selectedCategory, onCategoryChange }) => {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const totalCount = toolsData.reduce((sum, c) => sum + c.items.length, 0);

  const handleToggle = (cat: string) => {
    setExpanded((prev) => (prev === cat ? null : cat));
  };

  return (
    <Paper sx={{ p: 1, border: 1, borderColor: 'divider', position: 'sticky', top: 68 }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ px: 1.5, py: 1, display: 'block' }}>
        CATEGORIES
      </Typography>

      <List dense disablePadding>
        {/* All Tools */}
        <ListItemButton
          selected={selectedCategory === 'All'}
          onClick={() => onCategoryChange('All')}
          sx={{ borderRadius: 1, mb: 0.25, minHeight: 40 }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <Apps sx={{ fontSize: 18, color: selectedCategory === 'All' ? 'primary.main' : 'text.secondary' }} />
          </ListItemIcon>
          <ListItemText
            primary="All Tools"
            primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: selectedCategory === 'All' ? 700 : 500 }}
          />
          <Chip label={totalCount} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }} />
        </ListItemButton>

        {/* Category items */}
        {toolsData.map((cat: ToolCategory) => {
          const activeCount = cat.items.filter((t) => t.isActive).length;
          const isSelected = selectedCategory === cat.category;
          const isExpanded = expanded === cat.category;

          return (
            <Box key={cat.category}>
              <ListItemButton
                selected={isSelected}
                onClick={() => {
                  onCategoryChange(cat.category);
                  handleToggle(cat.category);
                }}
                sx={{ borderRadius: 1, mb: 0.25, minHeight: 40 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <Avatar
                    sx={{
                      width: 22, height: 22,
                      bgcolor: isSelected ? `${cat.color}20` : 'transparent',
                      color: isSelected ? cat.color : 'text.secondary',
                    }}
                  >
                    <cat.icon sx={{ fontSize: 14 }} />
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={cat.category}
                  primaryTypographyProps={{
                    fontSize: '0.78rem',
                    fontWeight: isSelected ? 700 : 500,
                    noWrap: true,
                  }}
                />
                <Chip
                  label={`${activeCount}/${cat.items.length}`}
                  size="small"
                  sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600, mr: 0.5 }}
                />
                {isExpanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
              </ListItemButton>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List dense disablePadding sx={{ pl: 3 }}>
                  {cat.items.map((tool) => (
                    <ListItemButton
                      key={tool.id}
                      sx={{ borderRadius: 1, py: 0.25, minHeight: 28, opacity: tool.isActive ? 1 : 0.5 }}
                      disabled={!tool.isActive}
                    >
                      <ListItemIcon sx={{ minWidth: 24 }}>
                        <tool.icon sx={{ fontSize: 12, color: tool.color }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={tool.name}
                        primaryTypographyProps={{ fontSize: '0.7rem', noWrap: true }}
                      />
                      {!tool.isActive && (
                        <Chip label="Soon" size="small" sx={{ height: 16, fontSize: '0.55rem' }} />
                      )}
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Paper>
  );
};

export default CategorySidebar;
