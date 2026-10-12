import React from 'react';
import { Bookmark } from '@mui/icons-material';
import SharedMarkdownOutput from '../../shared/components/MarkdownOutput';

interface MarkdownOutputProps {
  markdown: string;
  onCopy: () => void;
  onDownload: () => void;
}

const MarkdownOutput: React.FC<MarkdownOutputProps> = (props) => (
  <SharedMarkdownOutput
    Icon={Bookmark}
    emptyTitle="Enter a Notion page URL"
    emptyHint="Convert public Notion pages to clean Markdown"
    minHeight={450}
    maxHeight={500}
    {...props}
  />
);

export default MarkdownOutput;
