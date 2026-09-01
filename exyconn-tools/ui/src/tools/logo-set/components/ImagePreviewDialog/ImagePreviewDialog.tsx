import React from 'react';
import { Dialog, DialogContent, DialogTitle, Box, IconButton, Typography } from '@mui/material';
import { Close, Download } from '@mui/icons-material';

interface Props {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  label: string;
}

const ImagePreviewDialog: React.FC<Props> = ({ open, onClose, imageUrl, label }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${label.replace(/[×]/g, 'x')}.png`;
    link.click();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          🔍 Preview: {label}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton
            onClick={handleDownload}
            size="small"
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <Download sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 2, bgcolor: 'repeating-conic-gradient(#e5e5e5 0% 25%, #fff 0% 50%) 50% / 16px 16px' }}>
        <Box
          component="img"
          src={imageUrl}
          alt={label}
          sx={{
            display: 'block',
            maxWidth: '80vw',
            maxHeight: '70vh',
            objectFit: 'contain',
            margin: 'auto',
            borderRadius: 1,
            boxShadow: 3,
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewDialog;
