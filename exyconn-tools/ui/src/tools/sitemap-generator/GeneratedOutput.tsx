import React from 'react';
import { Paper, Box, Typography, TextField, IconButton, Tooltip } from '@mui/material';
import { ListAlt, ContentCopy, Download } from '@mui/icons-material';

interface GeneratedOutputProps {
  generatedXml: string;
  onCopy: () => void;
  onDownload: () => void;
}

const GeneratedOutput: React.FC<GeneratedOutputProps> = ({
  generatedXml,
  onCopy,
  onDownload,
}) => (
  <Paper
    elevation={0}
    sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%', minHeight: 500 }}
  >
    {!generatedXml ? (
      <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
        <ListAlt sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
        <Typography variant="body1">Add URLs and click Generate to create your sitemap</Typography>
      </Box>
    ) : (
      <>
        <Box
          sx={{
            p: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="subtitle2" fontWeight={600}>
            Generated Sitemap
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
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={18}
            value={generatedXml}
            InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } }}
          />
        </Box>
      </>
    )}
  </Paper>
);

export default GeneratedOutput;
