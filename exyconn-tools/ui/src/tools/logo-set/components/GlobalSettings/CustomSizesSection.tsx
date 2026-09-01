import React from 'react';
import { Box, Button, Badge, Chip, Divider } from '@mui/material';
import { Edit, Add } from '@mui/icons-material';
import { CustomSizesSectionProps } from './types';

const CustomSizesSection: React.FC<CustomSizesSectionProps> = ({ customSizes, onOpenCustomSizesDialog }) => (
  <Box>
    <Divider sx={{ my: 1 }}>
      <Chip label="Custom Sizes" size="small" sx={{ fontSize: '0.65rem' }} />
    </Divider>

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
      <Edit sx={{ fontSize: 16 }} color="action" />
      <Button
        size="small"
        variant="outlined"
        onClick={onOpenCustomSizesDialog}
        startIcon={<Add sx={{ fontSize: 14 }} />}
        sx={{ fontSize: '0.7rem', py: 0.25, flex: 1 }}
      >
        Manage Custom Sizes
      </Button>
      {customSizes.length > 0 && (
        <Badge badgeContent={customSizes.length} color="primary" sx={{ ml: 0.5 }}>
          <Box />
        </Badge>
      )}
    </Box>

    {customSizes.length > 0 && (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
        {customSizes.slice(0, 4).map((size) => (
          <Chip
            key={size.id}
            label={`${size.width}×${size.height}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.6rem' }}
          />
        ))}
        {customSizes.length > 4 && (
          <Chip
            label={`+${customSizes.length - 4} more`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.6rem' }}
          />
        )}
      </Box>
    )}
  </Box>
);

export default CustomSizesSection;
