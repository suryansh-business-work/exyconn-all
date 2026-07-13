import React from 'react';
import { Paper, Box, Typography, TextField, Button } from '@mui/material';

interface JsonInputPanelProps {
  content: string;
  onContentChange: (value: string) => void;
  onFormat: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const JsonInputPanel: React.FC<JsonInputPanelProps> = ({
  content,
  onContentChange,
  onFormat,
  onFileUpload,
}) => {
  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          JSON Content
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button size="small" variant="outlined" onClick={onFormat}>
            Format
          </Button>
          <Button component="label" size="small" variant="outlined">
            Upload
            <input type="file" accept=".json" hidden onChange={onFileUpload} />
          </Button>
        </Box>
      </Box>
      <TextField
        fullWidth
        multiline
        rows={14}
        placeholder='Paste your JSON content here...&#10;&#10;Example:&#10;{&#10;  "users": [&#10;    {"name": "John", "email": "john@test.com"},&#10;    {"name": "Jane", "email": "jane@test.com"}&#10;  ]&#10;}'
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        sx={{ fontFamily: 'monospace' }}
      />
    </Paper>
  );
};

export default JsonInputPanel;
