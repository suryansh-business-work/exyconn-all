import React from 'react';
import { TextFields } from '@mui/icons-material';
import SharedMarkdownOutput from '../../shared/components/MarkdownOutput';

interface MarkdownOutputProps {
  markdown: string;
  onCopy: () => void;
  onDownload: () => void;
}

const MarkdownOutput: React.FC<MarkdownOutputProps> = (props) => (
  <SharedMarkdownOutput
    Icon={TextFields}
    color="#6b7280"
    emptyTitle="Paste plain text to convert"
    emptyHint="Automatically detects and formats common patterns"
    {...props}
  />
);

export default MarkdownOutput;
