import React from 'react';
import { Article } from '@mui/icons-material';
import TextToMarkdown from '../../shared/components/TextToMarkdown';
import { APIs } from '../../shared/config/apis';

const RtfToMarkdown: React.FC = () => (
  <TextToMarkdown
    toolName="RTF to Markdown"
    Icon={Article}
    color="#8b5cf6"
    hoverColor="#7c3aed"
    endpoint={APIs.converterTools.rtfToMarkdown}
    format="RTF"
    accept=".rtf"
    placeholder="Paste your RTF content here or upload an RTF file..."
    emptyHint="The converted Markdown will appear here"
  />
);

export default RtfToMarkdown;
