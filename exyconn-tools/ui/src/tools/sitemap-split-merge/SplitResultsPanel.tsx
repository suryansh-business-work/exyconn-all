import React from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { CallSplit, Download, ExpandMore, ContentCopy } from '@mui/icons-material';
import { SplitResult } from './types';

interface SplitResultsPanelProps {
  result: SplitResult | null;
  onDownloadFile: (content: string, filename: string) => void;
  onCopyContent: (content: string) => void;
}

const SplitResultsPanel: React.FC<SplitResultsPanelProps> = ({
  result,
  onDownloadFile,
  onCopyContent,
}) => (
  <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, minHeight: 480 }}>
    {!result ? (
      <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
        <CallSplit sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
        <Typography variant="body1">Enter a large sitemap URL to split it</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Creates multiple smaller sitemaps and a sitemap index file
        </Typography>
      </Box>
    ) : (
      <Box sx={{ p: 2, maxHeight: 480, overflow: 'auto' }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography fontWeight={600}>sitemap-index.xml</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Button
                size="small"
                startIcon={<Download />}
                onClick={() => onDownloadFile(result.indexFile, 'sitemap-index.xml')}
              >
                Download
              </Button>
              <Button size="small" startIcon={<ContentCopy />} onClick={() => onCopyContent(result.indexFile)}>
                Copy
              </Button>
            </Box>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={result.indexFile}
              InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 11 } }}
            />
          </AccordionDetails>
        </Accordion>

        {result.sitemaps.map((s) => (
          <Accordion key={s.index}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Typography fontWeight={600}>sitemap-{s.index}.xml</Typography>
                <Typography variant="caption" color="text.secondary">
                  ({s.urlCount.toLocaleString()} URLs)
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Button
                  size="small"
                  startIcon={<Download />}
                  onClick={() => onDownloadFile(s.content, `sitemap-${s.index}.xml`)}
                >
                  Download
                </Button>
                <Button size="small" startIcon={<ContentCopy />} onClick={() => onCopyContent(s.content)}>
                  Copy
                </Button>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={6}
                value={s.content.substring(0, 2000) + (s.content.length > 2000 ? '\n...' : '')}
                InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: 11 } }}
              />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    )}
  </Paper>
);

export default SplitResultsPanel;
