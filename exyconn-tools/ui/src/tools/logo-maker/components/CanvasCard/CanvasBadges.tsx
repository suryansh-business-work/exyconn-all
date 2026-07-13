import React from 'react';
import { Chip } from '@mui/material';
import { CropFree, Check } from '@mui/icons-material';

interface CroppedBadgeProps {
  onClearCrop: () => void;
}

export const CroppedBadge: React.FC<CroppedBadgeProps> = ({ onClearCrop }) => (
  <Chip
    icon={<CropFree sx={{ fontSize: 10 }} />}
    label="Cropped"
    size="small"
    color="warning"
    onDelete={onClearCrop}
    sx={{
      position: 'absolute',
      top: -8,
      left: -8,
      height: 18,
      fontSize: '0.5rem',
      '& .MuiChip-icon': { fontSize: 10, ml: 0.5 },
      '& .MuiChip-label': { px: 0.5 },
      '& .MuiChip-deleteIcon': { fontSize: 12 },
    }}
  />
);

export const CustomSettingsBadge: React.FC = () => (
  <Chip
    icon={<Check sx={{ fontSize: 10 }} />}
    label="Custom"
    size="small"
    color="success"
    sx={{
      position: 'absolute',
      top: -8,
      right: -8,
      height: 18,
      fontSize: '0.5rem',
      '& .MuiChip-icon': { fontSize: 10, ml: 0.5 },
      '& .MuiChip-label': { px: 0.5 },
    }}
  />
);
