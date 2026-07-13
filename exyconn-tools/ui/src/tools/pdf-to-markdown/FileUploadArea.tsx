import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { PictureAsPdf, Upload, Delete } from '@mui/icons-material';

interface FileUploadAreaProps {
  file: File | null;
  loading: boolean;
  dragOver: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onRemoveFile: () => void;
  onConvert: () => void;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  file,
  loading,
  dragOver,
  onFileChange,
  onDrop,
  onDragOver,
  onDragLeave,
  onRemoveFile,
  onConvert,
}) => {
  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: 2,
          borderStyle: 'dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          borderRadius: 2,
          textAlign: 'center',
          bgcolor: dragOver ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s',
          cursor: 'pointer',
        }}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver();
        }}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => document.getElementById('pdf-input')?.click()}
      >
        <input id="pdf-input" type="file" accept=".pdf" hidden onChange={onFileChange} />
        <Upload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1" fontWeight={500}>
          {file ? file.name : 'Drop PDF file here or click to upload'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Supports PDF files up to 50MB
        </Typography>
      </Paper>

      {file && (
        <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PictureAsPdf color="error" />
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={onRemoveFile}>
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      )}

      <Button
        fullWidth
        variant="contained"
        onClick={onConvert}
        disabled={!file || loading}
        startIcon={loading ? <CircularProgress size={16} /> : <PictureAsPdf />}
        sx={{ mt: 2, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}
      >
        {loading ? 'Converting...' : 'Convert to Markdown'}
      </Button>
      {loading && <LinearProgress sx={{ mt: 1 }} />}
    </>
  );
};

export default FileUploadArea;
