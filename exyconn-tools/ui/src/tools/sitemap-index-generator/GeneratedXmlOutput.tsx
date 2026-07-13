import React from 'react';
import { Box, Typography, TextField, IconButton, Tooltip } from '@mui/material';
import { ListAlt, ContentCopy, Download } from '@mui/icons-material';

interface GeneratedXmlOutputProps {
  generatedXml: string;
  onCopy: () => void;
  onDownload: () => void;
}

const GeneratedXmlOutput: React.FC<GeneratedXmlOutputProps> = ({ generatedXml, onCopy, onDownload }) => {
  if (!generatedXml) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
        <ListAlt sx={{ fontSize: 48, mb: 2, opacity: 0.3, color: '#6366f1' }} />
        <Typography variant="body1">Add sitemap URLs and generate your index file</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          A sitemap index file helps search engines discover multiple sitemaps
        </Typography>
      </Box>
    );
  }

  return (
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
          Generated Sitemap Index
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
          rows={16}
          value={generatedXml}
          InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 12 } }}
        />
      </Box>
    </>
  );
};

export default GeneratedXmlOutput;
