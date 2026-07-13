import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import { RotateLeft, RotateRight, Flip } from '@mui/icons-material';

interface TransformControlsProps {
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onFlipH: () => void;
  onFlipV: () => void;
}

const TransformControls: React.FC<TransformControlsProps> = ({
  rotation,
  flipH,
  flipV,
  onRotateLeft,
  onRotateRight,
  onFlipH,
  onFlipV,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
      <Tooltip title="Rotate Left">
        <IconButton size="small" onClick={onRotateLeft}>
          <RotateLeft sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Rotate Right">
        <IconButton size="small" onClick={onRotateRight}>
          <RotateRight sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Flip Horizontal">
        <IconButton size="small" onClick={onFlipH} color={flipH ? 'primary' : 'default'}>
          <Flip sx={{ fontSize: 20 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Flip Vertical">
        <IconButton size="small" onClick={onFlipV} color={flipV ? 'primary' : 'default'}>
          <Flip sx={{ fontSize: 20, transform: 'rotate(90deg)' }} />
        </IconButton>
      </Tooltip>
      {rotation !== 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          {rotation}°
        </Typography>
      )}
    </Box>
  );
};

export default TransformControls;
