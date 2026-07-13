import React from 'react';
import { ButtonGroup, Button, Tooltip } from '@mui/material';
import { ContentCopy, Code, Check } from '@mui/icons-material';

interface CopyButtonsProps {
  hasContent: boolean;
  copied: 'html' | 'text' | null;
  onCopyRichText: () => void;
  onCopyHTML: () => void;
}

const CopyButtons: React.FC<CopyButtonsProps> = ({ hasContent, copied, onCopyRichText, onCopyHTML }) => {
  return (
    <ButtonGroup variant="contained" disabled={!hasContent}>
      <Tooltip title="Copy formatted signature - paste directly into your email client">
        <Button
          startIcon={copied === 'text' ? <Check /> : <ContentCopy />}
          onClick={onCopyRichText}
          color={copied === 'text' ? 'success' : 'primary'}
        >
          Copy Signature
        </Button>
      </Tooltip>
      <Tooltip title="Copy HTML code for email templates">
        <Button
          startIcon={copied === 'html' ? <Check /> : <Code />}
          onClick={onCopyHTML}
          color={copied === 'html' ? 'success' : 'primary'}
        >
          Copy HTML
        </Button>
      </Tooltip>
    </ButtonGroup>
  );
};

export default CopyButtons;
