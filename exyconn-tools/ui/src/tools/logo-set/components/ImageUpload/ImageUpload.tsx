import React, { useRef, useState, DragEvent } from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Modal, Backdrop } from '@mui/material';
import { CloudUpload, Delete, Brush, AutoFixHigh } from '@mui/icons-material';
import EraseTool from '../EraseTool/EraseTool';
import BackgroundRemovalDialog from '../BackgroundRemovalDialog/BackgroundRemovalDialog';

interface Props {
  onImageUpload: (image: string) => void;
  onDelete: () => void;
  currentImage: string | null;
}

const ImageUpload: React.FC<Props> = ({ onImageUpload, onDelete, currentImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showEraser, setShowEraser] = useState(false);
  const [showBgRemovalDialog, setShowBgRemovalDialog] = useState(false);

  const handleFile = (file: File) => {
    if (file?.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => e.target?.result && onImageUpload(e.target.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleEraseSave = (editedImage: string) => {
    onImageUpload(editedImage);
    setShowEraser(false);
  };

  const handleBgRemovalSuccess = (processedImage: string) => {
    onImageUpload(processedImage);
  };

  return (
    <Paper elevation={0} sx={{ p: 1.5, border: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Upload Logo
        </Typography>
        {currentImage && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Remove Background (AI)">
              <IconButton size="small" color="secondary" onClick={() => setShowBgRemovalDialog(true)}>
                <AutoFixHigh sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Erase parts">
              <IconButton size="small" color="primary" onClick={() => setShowEraser(true)}>
                <Brush sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete image">
              <IconButton size="small" color="error" onClick={onDelete}>
                <Delete sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      <Box
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        sx={{
          border: 2,
          borderStyle: 'dashed',
          borderRadius: 1,
          p: 2,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          borderColor: isDragging ? 'primary.main' : currentImage ? 'success.main' : 'divider',
          bgcolor: isDragging ? 'action.hover' : 'transparent',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleFile(e.target.files?.[0]!)}
        />

        {currentImage ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Box
              component="img"
              src={currentImage}
              alt="Logo"
              sx={{ maxHeight: 60, maxWidth: '100%', borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
              Click or drag to replace
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <CloudUpload sx={{ fontSize: 32, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Drag & drop or click
            </Typography>
          </Box>
        )}
      </Box>

      {/* Erase Tool Modal */}
      <Modal
        open={showEraser}
        onClose={() => setShowEraser(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 300 } }}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300 }}
      >
        <Box sx={{ position: 'relative', zIndex: 1301 }}>
          {currentImage && (
            <EraseTool image={currentImage} onSave={handleEraseSave} onClose={() => setShowEraser(false)} />
          )}
        </Box>
      </Modal>

      {/* Background Removal Dialog */}
      {currentImage && (
        <BackgroundRemovalDialog
          open={showBgRemovalDialog}
          onClose={() => setShowBgRemovalDialog(false)}
          currentImage={currentImage}
          onSuccess={handleBgRemovalSuccess}
        />
      )}
    </Paper>
  );
};

export default ImageUpload;
