import React from 'react';
import { Box, Typography, ListItem, ListItemButton, ListItemText, ListItemIcon, Chip, IconButton } from '@mui/material';
import { Business as BusinessIcon, Star, ExpandMore, ExpandLess } from '@mui/icons-material';
import { Business } from '../../types';

interface BusinessListItemProps {
  business: Business;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

const BusinessListItem: React.FC<BusinessListItemProps> = ({
  business,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
}) => {
  const handleClick = () => {
    onSelect();
    onToggleExpand();
  };

  return (
    <ListItem
      disablePadding
      sx={{
        bgcolor: isSelected ? 'primary.50' : 'transparent',
      }}
    >
      <ListItemButton onClick={handleClick}>
        <ListItemIcon sx={{ minWidth: 36 }}>
          <BusinessIcon color="primary" />
        </ListItemIcon>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" fontWeight={500} noWrap>
                {business.name}
              </Typography>
              {business.rating && (
                <Chip
                  icon={<Star sx={{ fontSize: 14 }} />}
                  label={business.rating}
                  size="small"
                  color={business.rating >= 4 ? 'success' : 'default'}
                  sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: '0.7rem' } }}
                />
              )}
            </Box>
          }
          secondary={
            <Typography variant="caption" color="text.secondary" noWrap>
              {business.address}
            </Typography>
          }
        />
        <IconButton size="small">{isExpanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
      </ListItemButton>
    </ListItem>
  );
};

export default BusinessListItem;
