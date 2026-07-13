import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material';
import { ConversionOptions } from './types';

interface TextInputPanelProps {
  content: string;
  options: ConversionOptions;
  onContentChange: (value: string) => void;
  onOptionsChange: (options: ConversionOptions) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TextInputPanel: React.FC<TextInputPanelProps> = ({
  content,
  options,
  onContentChange,
  onOptionsChange,
  onFileUpload,
}) => (
  <>
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Plain Text Content
        </Typography>
        <Button component="label" size="small" variant="outlined">
          Upload TXT
          <input type="file" accept=".txt" hidden onChange={onFileUpload} />
        </Button>
      </Box>
      <TextField
        fullWidth
        multiline
        rows={10}
        placeholder={
          'Paste your plain text content here...\n\nThe converter will detect:\n- Headings (ALL CAPS lines)\n- Lists (lines starting with -, *, or numbers)\n- URLs (will become links)\n- Code blocks (indented lines)'
        }
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
      />
    </Paper>

    <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Detection Options
      </Typography>
      <Stack direction="row" flexWrap="wrap" sx={{ gap: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={options.detectHeadings}
              onChange={(e) => onOptionsChange({ ...options, detectHeadings: e.target.checked })}
            />
          }
          label="Headings"
        />
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={options.detectLists}
              onChange={(e) => onOptionsChange({ ...options, detectLists: e.target.checked })}
            />
          }
          label="Lists"
        />
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={options.detectLinks}
              onChange={(e) => onOptionsChange({ ...options, detectLinks: e.target.checked })}
            />
          }
          label="Links"
        />
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={options.detectCodeBlocks}
              onChange={(e) => onOptionsChange({ ...options, detectCodeBlocks: e.target.checked })}
            />
          }
          label="Code Blocks"
        />
      </Stack>
    </Paper>
  </>
);

export default TextInputPanel;
