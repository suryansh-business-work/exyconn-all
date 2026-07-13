import React from 'react';
import { Box, Typography, CircularProgress, alpha } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';

interface DropZoneProps {
  isDragOver: boolean;
  isUploading: boolean;
  error: string | null;
  label: string;
  maxWidth: number;
  maxHeight: number;
  circular: boolean;
  borderRadius: number;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onClick: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({
  isDragOver,
  isUploading,
  error,
  label,
  maxWidth,
  maxHeight,
  circular,
  borderRadius,
  onDrop,
  onDragOver,
  onDragLeave,
  onClick,
}) => {
  return (
    <Box
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onClick}
      sx={{
        border: 2,
        borderStyle: 'dashed',
        borderColor: isDragOver ? 'primary.main' : error ? 'error.main' : 'divider',
        borderRadius: circular ? '50%' : borderRadius,
        width: maxWidth,
        height: maxHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isUploading ? 'wait' : 'pointer',
        bgcolor: isDragOver ? alpha('#2563eb', 0.08) : 'transparent',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: alpha('#2563eb', 0.04),
        },
      }}
    >
      {isUploading ? (
        <CircularProgress size={32} />
      ) : (
        <>
          <ImageIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
          <Typography variant="caption" color="text.secondary" textAlign="center">
            {label}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default DropZone;
