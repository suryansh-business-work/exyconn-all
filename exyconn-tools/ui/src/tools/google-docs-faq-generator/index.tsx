import React from 'react';
import { CloudSync } from '@mui/icons-material';
import UrlFaqGenerator from '../../shared/components/UrlFaqGenerator';
import { APIs } from '../../shared/config/apis';

const GoogleDocsFAQGenerator: React.FC = () => (
  <UrlFaqGenerator
    toolName="Google Docs FAQ Generator"
    Icon={CloudSync}
    color="#4285f4"
    endpoint={APIs.converterTools.googleDocsToMarkdown}
    source="Google Docs content"
    subject="the document"
    fetchError="Failed to fetch Google Doc"
    emptyError="No content found in the document"
    heading="Google Docs URL"
    urlLabel="Google Docs URL"
    urlPlaceholder="https://docs.google.com/document/d/..."
    keyHint="FAQs are written by OpenAI from the fetched Google Doc using your own key."
  />
);

export default GoogleDocsFAQGenerator;
