import React from 'react';
import { PictureAsPdf } from '@mui/icons-material';
import SharedMarkdownOutput from '../../shared/components/MarkdownOutput';

interface MarkdownOutputProps {
  markdown: string;
  onCopy: () => void;
  onDownload: () => void;
}

const MarkdownOutput: React.FC<MarkdownOutputProps> = (props) => (
  <SharedMarkdownOutput
    Icon={PictureAsPdf}
    color="#ef4444"
    emptyTitle="Upload a PDF to convert"
    emptyHint="The converted Markdown will appear here"
    maxHeight={500}
    {...props}
  />
);

export default MarkdownOutput;
