import React from 'react';
import { Description } from '@mui/icons-material';
import MarkdownFileUpload, { type FileUploadHandlers } from '../../shared/components/MarkdownFileUpload';

const FileUploadArea: React.FC<FileUploadHandlers> = (props) => (
  <MarkdownFileUpload
    Icon={Description}
    iconColor="primary"
    color="#2563eb"
    hoverColor="#1d4ed8"
    inputId="docx-input"
    accept=".docx"
    dropLabel="Drop Word document here or click to upload"
    supportedFormats="Supports .docx files up to 50MB"
    {...props}
  />
);

export default FileUploadArea;
