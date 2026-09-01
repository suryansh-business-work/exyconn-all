import React from 'react';
import { Box, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { AspectRatio, CropSquare, CropLandscape, CropFree } from '@mui/icons-material';

type AspectOption = 'free' | 'square' | 'target' | '16:9' | '4:3' | '3:2';

interface AspectRatioControlsProps {
  aspectOption: AspectOption;
  targetSize: { width: number; height: number };
  onChange: (option: AspectOption) => void;
}

const AspectRatioControls: React.FC<AspectRatioControlsProps> = ({ aspectOption, targetSize, onChange }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <AspectRatio sx={{ fontSize: 18, color: 'text.secondary' }} />
      <ToggleButtonGroup value={aspectOption} exclusive onChange={(_, v) => v && onChange(v)} size="small">
        <ToggleButton value="target" sx={{ px: 1, py: 0.25, fontSize: '0.65rem' }}>
          <Tooltip title={`${targetSize.width}:${targetSize.height}`}>
            <span>Target</span>
          </Tooltip>
        </ToggleButton>
        <ToggleButton value="square" sx={{ px: 1, py: 0.25, fontSize: '0.65rem' }}>
          <CropSquare sx={{ fontSize: 14 }} />
        </ToggleButton>
        <ToggleButton value="16:9" sx={{ px: 1, py: 0.25, fontSize: '0.65rem' }}>
          <CropLandscape sx={{ fontSize: 14 }} />
        </ToggleButton>
        <ToggleButton value="4:3" sx={{ px: 1, py: 0.25, fontSize: '0.65rem' }}>
          4:3
        </ToggleButton>
        <ToggleButton value="free" sx={{ px: 1, py: 0.25, fontSize: '0.65rem' }}>
          <CropFree sx={{ fontSize: 14 }} />
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default AspectRatioControls;
