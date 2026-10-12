import React from 'react';
import { Paper, Box, Typography, Button, IconButton, CircularProgress, LinearProgress } from '@mui/material';
import { Upload, Delete } from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

/** The upload state and handlers a "<file> to Markdown" tool owns. */
export interface FileUploadHandlers {
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

export interface MarkdownFileUploadProps extends FileUploadHandlers {
  Icon: SvgIconComponent;
  /** The MUI palette colour of the chosen file's icon. */
  iconColor: 'primary' | 'error';
  color: string;
  hoverColor: string;
  inputId: string;
  /** The file input's `accept` attribute. */
  accept: string;
  dropLabel: string;
  supportedFormats: string;
}

/** The drop zone, chosen file and convert button of a "<file> to Markdown" tool. */
const MarkdownFileUpload: React.FC<Readonly<MarkdownFileUploadProps>> = ({
  Icon,
  iconColor,
  color,
  hoverColor,
  inputId,
  accept,
  dropLabel,
  supportedFormats,
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
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <input id={inputId} type="file" accept={accept} hidden onChange={onFileChange} />
        <Upload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography
          variant="body1"
          sx={{
            fontWeight: 500,
          }}
        >
          {file ? file.name : dropLabel}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mt: 1,
          }}
        >
          {supportedFormats}
        </Typography>
      </Paper>

      {file && (
        <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Icon color={iconColor} />
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                  }}
                >
                  {file.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                  }}
                >
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
        startIcon={loading ? <CircularProgress size={16} /> : <Icon />}
        sx={{ mt: 2, bgcolor: color, '&:hover': { bgcolor: hoverColor } }}
      >
        {loading ? 'Converting...' : 'Convert to Markdown'}
      </Button>
      {loading && <LinearProgress sx={{ mt: 1 }} />}
    </>
  );
};

export default MarkdownFileUpload;
