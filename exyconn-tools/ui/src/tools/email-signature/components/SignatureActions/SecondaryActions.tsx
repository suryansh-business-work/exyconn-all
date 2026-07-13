import React from 'react';
import { Box, Button, Tooltip, IconButton } from '@mui/material';
import { Download, Send, RestartAlt } from '@mui/icons-material';

interface SecondaryActionsProps {
  hasContent: boolean;
  onDownload: () => void;
  onTestEmail: () => void;
  onReset: () => void;
}

const SecondaryActions: React.FC<SecondaryActionsProps> = ({ hasContent, onDownload, onTestEmail, onReset }) => {
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Download as HTML file">
        <span>
          <Button variant="outlined" startIcon={<Download />} onClick={onDownload} disabled={!hasContent}>
            Download
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Send a test email with your signature">
        <span>
          <Button variant="outlined" startIcon={<Send />} onClick={onTestEmail} disabled={!hasContent}>
            Test Email
          </Button>
        </span>
      </Tooltip>
      <Tooltip title="Reset all fields">
        <IconButton color="error" onClick={onReset}>
          <RestartAlt />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default SecondaryActions;
