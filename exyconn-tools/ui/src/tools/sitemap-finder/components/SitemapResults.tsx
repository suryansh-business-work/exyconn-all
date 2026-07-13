import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  List,
  Divider,
  Alert,
} from '@mui/material';
import {
  Map,
  CheckCircle,
  ContentCopy,
} from '@mui/icons-material';
import { SitemapResult } from '../types';
import SummaryStats from './SummaryStats';
import SitemapListItem from './SitemapListItem';
import CheckedLocations from './CheckedLocations';

interface SitemapResultsProps {
  result: SitemapResult;
}

const SitemapResults: React.FC<SitemapResultsProps> = ({ result }) => {
  const [copiedItem, setCopiedItem] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleCopyAllUrls = () => {
    const urls = result.sitemapsFound.map((s) => s.url).join('\n');
    navigator.clipboard.writeText(urls);
    setCopiedItem('all-urls');
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const validSitemaps = result.sitemapsFound.filter((s) => s.isValid);
  const invalidSitemapsCount = result.sitemapsFound.filter((s) => !s.isValid).length;

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          Sitemap Results
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            label={`${result.sitemapsFound.length} sitemaps found`}
            size="small"
            color="primary"
            icon={<Map fontSize="small" />}
          />
          <Chip label={`${(result.scanTime / 1000).toFixed(2)}s`} size="small" variant="outlined" />
        </Box>
      </Box>

      {/* Summary Stats */}
      <SummaryStats
        validCount={validSitemaps.length}
        totalUrls={result.totalUrls}
        invalidCount={invalidSitemapsCount}
        robotsTxtExists={result.robotsTxtExists}
      />

      <Divider sx={{ mb: 2 }} />

      {/* Found Sitemaps List */}
      {result.sitemapsFound.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Found Sitemaps
            </Typography>
            <Tooltip title="Copy all sitemap URLs">
              <IconButton size="small" onClick={handleCopyAllUrls}>
                {copiedItem === 'all-urls' ? (
                  <CheckCircle fontSize="small" color="success" />
                ) : (
                  <ContentCopy fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
          </Box>

          <List disablePadding>
            {result.sitemapsFound.map((sitemap, idx) => (
              <SitemapListItem
                key={idx}
                sitemap={sitemap}
                index={idx}
                copiedItem={copiedItem}
                onCopy={handleCopy}
              />
            ))}
          </List>
        </>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No sitemaps were found for this website. The site may not have a sitemap, or it may be located in a
          non-standard location.
        </Alert>
      )}

      {/* Checked Locations */}
      <CheckedLocations locations={result.checkedLocations} />
    </Paper>
  );
};

export default SitemapResults;
