import React from 'react';
import { DataObject } from '@mui/icons-material';
import SharedMarkdownOutput from '../../shared/components/MarkdownOutput';

interface MarkdownOutputProps {
  markdown: string;
  onCopy: () => void;
  onDownload: () => void;
}

const MarkdownOutput: React.FC<MarkdownOutputProps> = (props) => (
  <SharedMarkdownOutput
    Icon={DataObject}
    color="#3b82f6"
    emptyTitle="Paste JSON content to convert"
    emptyHint="Arrays of objects become tables, nested objects become lists"
    {...props}
  />
);

export default MarkdownOutput;
