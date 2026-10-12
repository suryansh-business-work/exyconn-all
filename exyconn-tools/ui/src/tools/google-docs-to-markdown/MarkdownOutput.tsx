import React from 'react';
import { InsertDriveFile } from '@mui/icons-material';
import SharedMarkdownOutput from '../../shared/components/MarkdownOutput';

interface MarkdownOutputProps {
  markdown: string;
  onCopy: () => void;
  onDownload: () => void;
}

const MarkdownOutput: React.FC<MarkdownOutputProps> = (props) => (
  <SharedMarkdownOutput
    Icon={InsertDriveFile}
    color="#4285f4"
    emptyTitle="Enter a Google Docs URL"
    emptyHint="Convert shared Google Docs to clean Markdown"
    minHeight={450}
    maxHeight={500}
    {...props}
  />
);

export default MarkdownOutput;
