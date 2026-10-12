import React from 'react';
import { PictureAsPdf } from '@mui/icons-material';
import MarkdownFileUpload, { type FileUploadHandlers } from '../../shared/components/MarkdownFileUpload';

const FileUploadArea: React.FC<FileUploadHandlers> = (props) => (
  <MarkdownFileUpload
    Icon={PictureAsPdf}
    iconColor="error"
    color="#ef4444"
    hoverColor="#dc2626"
    inputId="pdf-input"
    accept=".pdf"
    dropLabel="Drop PDF file here or click to upload"
    supportedFormats="Supports PDF files up to 50MB"
    {...props}
  />
);

export default FileUploadArea;
