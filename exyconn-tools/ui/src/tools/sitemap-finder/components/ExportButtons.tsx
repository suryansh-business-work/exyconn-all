import React from 'react';
import { Box, Button, Paper, Typography, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Download, Code, TableChart, Description, ContentCopy, CheckCircle } from '@mui/icons-material';
import { SitemapResult } from '../types';

interface ExportButtonsProps {
  result: SitemapResult;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ result }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [copied, setCopied] = React.useState(false);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    handleClose();
  };

  const exportAsJSON = () => {
    const data = {
      baseUrl: result.baseUrl,
      scanDate: new Date().toISOString(),
      totalSitemaps: result.sitemapsFound.length,
      totalUrls: result.totalUrls,
      robotsTxtExists: result.robotsTxtExists,
      sitemaps: result.sitemapsFound.map((s) => ({
        url: s.url,
        type: s.type,
        urlCount: s.urlCount,
        isValid: s.isValid,
        lastModified: s.lastModified,
        size: s.size,
      })),
    };
    downloadFile(JSON.stringify(data, null, 2), 'sitemap-report.json', 'application/json');
  };

  const exportAsCSV = () => {
    const headers = ['URL', 'Type', 'URL Count', 'Valid', 'Last Modified', 'Size'];
    const rows = result.sitemapsFound.map((s) => [
      s.url,
      s.type,
      s.urlCount,
      s.isValid ? 'Yes' : 'No',
      s.lastModified || '',
      s.size || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadFile(csv, 'sitemap-report.csv', 'text/csv');
  };

  const exportAsTXT = () => {
    const content = [
      `Sitemap Report for ${result.baseUrl}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `Summary:`,
      `- Sitemaps Found: ${result.sitemapsFound.length}`,
      `- Total URLs: ${result.totalUrls}`,
      `- robots.txt: ${result.robotsTxtExists ? 'Found' : 'Not Found'}`,
      ``,
      `Sitemaps:`,
      ...result.sitemapsFound.map(
        (s) => `- ${s.url} (${s.type}, ${s.urlCount} URLs, ${s.isValid ? 'Valid' : 'Invalid'})`
      ),
    ].join('\n');
    downloadFile(content, 'sitemap-report.txt', 'text/plain');
  };

  const copyAllUrls = () => {
    const urls = result.sitemapsFound.map((s) => s.url).join('\n');
    navigator.clipboard.writeText(urls);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    handleClose();
  };

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
        Export Results
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" size="small" startIcon={<Download />} onClick={handleClick}>
          Download
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={copied ? <CheckCircle color="success" /> : <ContentCopy />}
          onClick={copyAllUrls}
        >
          {copied ? 'Copied!' : 'Copy URLs'}
        </Button>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem onClick={exportAsJSON}>
          <ListItemIcon>
            <Code fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="JSON" secondary="Structured data format" />
        </MenuItem>
        <MenuItem onClick={exportAsCSV}>
          <ListItemIcon>
            <TableChart fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="CSV" secondary="Spreadsheet compatible" />
        </MenuItem>
        <MenuItem onClick={exportAsTXT}>
          <ListItemIcon>
            <Description fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Text" secondary="Plain text report" />
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default ExportButtons;
