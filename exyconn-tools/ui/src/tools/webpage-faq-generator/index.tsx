import React from 'react';
import { Link } from '@mui/icons-material';
import UrlFaqGenerator from '../../shared/components/UrlFaqGenerator';
import { APIs } from '../../shared/config/apis';

const WebpageFAQGenerator: React.FC = () => (
  <UrlFaqGenerator
    toolName="Webpage FAQ Generator"
    Icon={Link}
    color="#3b82f6"
    endpoint={APIs.converterTools.webpageToMarkdown}
    source="webpage content"
    subject="the page"
    citeUrl
    fetchError="Failed to fetch webpage"
    emptyError="No content found on the webpage"
    heading="Webpage URL"
    urlLabel="Webpage URL"
    urlPlaceholder="https://example.com/about"
    keyHint="FAQs are written by OpenAI from the fetched webpage using your own key."
  />
);

export default WebpageFAQGenerator;
