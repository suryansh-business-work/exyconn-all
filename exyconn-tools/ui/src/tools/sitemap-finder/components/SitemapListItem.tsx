import React from 'react';
import {
  Box, Typography, Chip, IconButton, Tooltip,
  ListItem, ListItemIcon, ListItemText, ListItemSecondaryAction, Link,
} from '@mui/material';
import {
  CheckCircle, ContentCopy, OpenInNew, Description,
  Folder, TextSnippet, Language, Map, Numbers,
} from '@mui/icons-material';
import { SitemapInfo } from '../types';

interface SitemapListItemProps {
  sitemap: SitemapInfo;
  index: number;
  copiedItem: string | null;
  onCopy: (text: string, id: string) => void;
}

const getTypeIcon = (type: SitemapInfo['type']) => {
  switch (type) {
    case 'index': return <Folder color="primary" />;
    case 'xml': return <Description color="success" />;
    case 'txt': return <TextSnippet color="action" />;
    case 'html': return <Language color="warning" />;
    default: return <Map color="action" />;
  }
};

const getTypeLabel = (type: SitemapInfo['type']) => {
  switch (type) {
    case 'index': return 'Sitemap Index';
    case 'xml': return 'XML Sitemap';
    case 'txt': return 'Text Sitemap';
    case 'html': return 'HTML Sitemap';
    default: return 'Unknown';
  }
};

const SitemapListItemComponent: React.FC<SitemapListItemProps> = ({ sitemap, index, copiedItem, onCopy }) => (
  <ListItem
    sx={{
      border: 1,
      borderColor: sitemap.isValid ? 'success.200' : 'error.200',
      borderRadius: 1,
      mb: 1,
      bgcolor: sitemap.isValid ? 'success.50' : 'error.50',
      flexWrap: 'wrap',
    }}
  >
    <ListItemIcon sx={{ minWidth: 40 }}>{getTypeIcon(sitemap.type)}</ListItemIcon>
    <ListItemText
      primary={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {sitemap.url}
          </Typography>
          <Chip
            label={getTypeLabel(sitemap.type)}
            size="small"
            variant="outlined"
            color={sitemap.isValid ? 'success' : 'error'}
          />
        </Box>
      }
      secondary={
        <Box sx={{ display: 'flex', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            <Numbers fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            {sitemap.urlCount.toLocaleString()} URLs
          </Typography>
          {sitemap.size && (
            <Typography variant="caption" color="text.secondary">
              Size: {sitemap.size}
            </Typography>
          )}
          {sitemap.lastModified && (
            <Typography variant="caption" color="text.secondary">
              Modified: {sitemap.lastModified}
            </Typography>
          )}
          {sitemap.errorMessage && (
            <Typography variant="caption" color="error.main">
              {sitemap.errorMessage}
            </Typography>
          )}
        </Box>
      }
    />
    <ListItemSecondaryAction>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        <Tooltip title="Copy URL">
          <IconButton size="small" onClick={() => onCopy(sitemap.url, `sitemap-${index}`)}>
            {copiedItem === `sitemap-${index}` ? (
              <CheckCircle fontSize="small" color="success" />
            ) : (
              <ContentCopy fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
        <Tooltip title="Open in new tab">
          <IconButton
            size="small"
            component={Link}
            href={sitemap.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <OpenInNew fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </ListItemSecondaryAction>
  </ListItem>
);

export default SitemapListItemComponent;
