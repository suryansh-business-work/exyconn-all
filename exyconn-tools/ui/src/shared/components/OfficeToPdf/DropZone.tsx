import { useState, type ChangeEvent, type DragEvent } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import CloudUpload from '@mui/icons-material/CloudUpload';
import type { OfficeToPdfConfig } from './types';

type DropZoneProps = Pick<OfficeToPdfConfig, 'color' | 'accept' | 'dropTitle' | 'supportedFormats'> & {
  onFile: (file: File) => void;
};

export default function DropZone({ color, accept, dropTitle, supportedFormats, onFile }: Readonly<DropZoneProps>) {
  const [dragOver, setDragOver] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
  };
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFile(e.target.files[0]);
    }
    e.target.value = '';
  };

  return (
    <Paper
      sx={{
        p: 4,
        textAlign: 'center',
        border: '2px dashed',
        borderColor: dragOver ? color : 'divider',
        cursor: 'pointer',
        transition: '0.2s',
      }}
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <CloudUpload sx={{ fontSize: 48, color, mb: 1 }} />
      <Typography variant="h6" gutterBottom>
        {dropTitle}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mb: 1,
        }}
      >
        {supportedFormats}
      </Typography>
      <Button variant="outlined" component="label" sx={{ color, borderColor: color }}>
        Browse Files <input hidden accept={accept} type="file" onChange={onFileChange} />
      </Button>
    </Paper>
  );
}
