import React from 'react';
import { DataObject } from '@mui/icons-material';
import TextToMarkdown from '../../shared/components/TextToMarkdown';
import { APIs } from '../../shared/config/apis';

const XmlToMarkdown: React.FC = () => (
  <TextToMarkdown
    toolName="XML to Markdown"
    Icon={DataObject}
    color="#22c55e"
    hoverColor="#16a34a"
    endpoint={APIs.converterTools.xmlToMarkdown}
    format="XML"
    accept=".xml"
    placeholder='Paste your XML content here...&#10;&#10;Example:&#10;<users>&#10;  <user id="1">&#10;    <name>John Doe</name>&#10;    <email>john@example.com</email>&#10;  </user>&#10;</users>'
    emptyHint="XML structure becomes formatted Markdown"
  />
);

export default XmlToMarkdown;
