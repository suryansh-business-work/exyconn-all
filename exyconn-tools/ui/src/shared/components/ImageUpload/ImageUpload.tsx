import React, { useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { uploadImage, deleteImage } from '../../services/api';
import ImagePreview from './ImagePreview';
import DropZone from './DropZone';

interface ImageUploadProps {
  value: string;
  fileId?: string;
  onChange: (url: string, fileId?: string) => void;
  folder?: string;
  label?: string;
  helperText?: string;
  maxSize?: number;
  accept?: string;
  aspectRatio?: string;
  maxWidth?: number;
  maxHeight?: number;
  circular?: boolean;
  borderRadius?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  fileId,
  onChange,
  folder = '/email-signatures',
  label = 'Upload Image',
  helperText,
  maxSize = 5,
  accept = 'image/*',
  maxWidth = 200,
  maxHeight = 200,
  circular = false,
  borderRadius = 0,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadImage(file, folder, file.name);

      if (result.success && result.url) {
        onChange(result.url, result.fileId);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = async () => {
    if (fileId) await deleteImage(fileId);
    onChange('', undefined);
    setError(null);
  };

  return (
    <Box>
      <input type="file" ref={fileInputRef} onChange={handleInputChange} accept={accept} style={{ display: 'none' }} />

      {value ? (
        <ImagePreview
          value={value}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          circular={circular}
          borderRadius={borderRadius}
          isUploading={isUploading}
          onReplace={() => fileInputRef.current?.click()}
          onRemove={handleRemove}
        />
      ) : (
        <DropZone
          isDragOver={isDragOver}
          isUploading={isUploading}
          error={error}
          label={label}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          circular={circular}
          borderRadius={borderRadius}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        />
      )}

      {helperText && !error && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ImageUpload;
