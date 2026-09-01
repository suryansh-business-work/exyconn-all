import React from 'react';
import { Box, Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import { CustomSize } from '../../types';

interface AddSizeButtonsProps {
  sizesCount: number;
  onAddSize: (size: CustomSize) => void;
}

const generateId = (): string => {
  return 'custom-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

const AddSizeButtons: React.FC<AddSizeButtonsProps> = ({ sizesCount, onAddSize }) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<Add />}
        onClick={() =>
          onAddSize({
            id: generateId(),
            width: 512,
            height: 512,
            label: `Custom ${sizesCount + 1}`,
          })
        }
      >
        Add Size
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={() =>
          onAddSize({
            id: generateId(),
            width: 1920,
            height: 1080,
            label: 'HD Landscape',
          })
        }
      >
        + 1920×1080
      </Button>
      <Button
        variant="outlined"
        size="small"
        onClick={() =>
          onAddSize({
            id: generateId(),
            width: 3840,
            height: 2160,
            label: '4K',
          })
        }
      >
        + 4K
      </Button>
    </Box>
  );
};

export default AddSizeButtons;
