import React from 'react';
import { Code } from '@mui/icons-material';
import TextToMarkdown from '../../shared/components/TextToMarkdown';
import { APIs } from '../../shared/config/apis';

const HtmlToMarkdown: React.FC = () => (
  <TextToMarkdown
    toolName="HTML to Markdown"
    Icon={Code}
    color="#f97316"
    hoverColor="#ea580c"
    endpoint={APIs.converterTools.htmlToMarkdown}
    format="HTML"
    accept=".html,.htm"
    placeholder="Paste your HTML content here...&#10;&#10;Example:&#10;<h1>Hello World</h1>&#10;<p>This is a <strong>paragraph</strong> with <em>formatting</em>.</p>&#10;<ul>&#10;  <li>Item 1</li>&#10;  <li>Item 2</li>&#10;</ul>"
    emptyHint="Converts headings, paragraphs, lists, links, and more"
  />
);

export default HtmlToMarkdown;
