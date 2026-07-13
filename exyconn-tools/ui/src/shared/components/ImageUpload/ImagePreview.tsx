import React from 'react';
import { Box, Button, IconButton } from '@mui/material';
import { CloudUpload, Delete, CheckCircle } from '@mui/icons-material';

interface ImagePreviewProps {
  value: string;
  maxWidth: number;
  maxHeight: number;
  circular: boolean;
  borderRadius: number;
  isUploading: boolean;
  onReplace: () => void;
  onRemove: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  value,
  maxWidth,
  maxHeight,
  circular,
  borderRadius,
  isUploading,
  onReplace,
  onRemove,
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <Box
        sx={{
          width: maxWidth,
          height: maxHeight,
          borderRadius: circular ? '50%' : borderRadius,
          overflow: 'hidden',
          border: 2,
          borderColor: 'success.main',
          position: 'relative',
        }}
      >
        <img
          src={value}
          alt="Uploaded"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            bgcolor: 'success.main',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle sx={{ fontSize: 16, color: 'white' }} />
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          startIcon={<CloudUpload />}
          onClick={onReplace}
          disabled={isUploading}
          sx={{ minWidth: 'auto', px: 1, fontSize: '0.75rem' }}
        >
          Replace
        </Button>
        <IconButton size="small" color="error" onClick={onRemove} disabled={isUploading} sx={{ alignSelf: 'center' }}>
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ImagePreview;
