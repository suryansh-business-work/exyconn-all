import React from 'react';
import { Bookmark } from '@mui/icons-material';
import UrlFaqGenerator from '../../shared/components/UrlFaqGenerator';
import { APIs } from '../../shared/config/apis';

const NotionFAQGenerator: React.FC = () => (
  <UrlFaqGenerator
    toolName="Notion FAQ Generator"
    Icon={Bookmark}
    color="#000000"
    endpoint={APIs.converterTools.notionToMarkdown}
    source="Notion page content"
    subject="the content"
    fetchError="Failed to fetch Notion page"
    emptyError="No content found in the Notion page"
    heading="Notion Page URL"
    urlLabel="Notion Public URL"
    urlPlaceholder="https://notion.so/..."
    keyHint="FAQs are written by OpenAI from the fetched Notion page using your own key."
  />
);

export default NotionFAQGenerator;
