import React from 'react';
import { Paper, Box, Typography, IconButton, Tooltip } from '@mui/material';
import { DataObject, ContentCopy, Download } from '@mui/icons-material';

interface MarkdownOutputProps {
  markdown: string;
  onCopy: () => void;
  onDownload: () => void;
}

const MarkdownOutput: React.FC<MarkdownOutputProps> = ({ markdown, onCopy, onDownload }) => {
  return (
    <Paper
      elevation={0}
      sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%', minHeight: 400 }}
    >
      {!markdown ? (
        <Box
          sx={{
            p: 4,
            textAlign: 'center',
            color: 'text.secondary',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <DataObject sx={{ fontSize: 48, mb: 2, opacity: 0.3, color: '#3b82f6' }} />
          <Typography variant="body1">Paste JSON content to convert</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Arrays of objects become tables, nested objects become lists
          </Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              p: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              Converted Markdown
            </Typography>
            <Box>
              <Tooltip title="Copy">
                <IconButton size="small" onClick={onCopy}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download">
                <IconButton size="small" onClick={onDownload}>
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Box sx={{ p: 2, maxHeight: 450, overflow: 'auto' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13 }}>
              {markdown}
            </pre>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default MarkdownOutput;
