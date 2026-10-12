import React from 'react';
import { Description } from '@mui/icons-material';
import SharedMarkdownOutput from '../../shared/components/MarkdownOutput';

interface MarkdownOutputProps {
  markdown: string;
  onCopy: () => void;
  onDownload: () => void;
}

const MarkdownOutput: React.FC<MarkdownOutputProps> = (props) => (
  <SharedMarkdownOutput
    Icon={Description}
    color="#2563eb"
    emptyTitle="Upload a Word document to convert"
    emptyHint="The converted Markdown will appear here"
    maxHeight={500}
    {...props}
  />
);

export default MarkdownOutput;
