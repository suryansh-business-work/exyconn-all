import React from 'react';
import { Paper, Box, Typography, IconButton, Tooltip } from '@mui/material';
import { ContentCopy, Download } from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';

export interface MarkdownOutputProps {
  markdown: string;
  Icon: SvgIconComponent;
  /** The empty state's icon colour; the theme's text colour when omitted. */
  color?: string;
  emptyTitle: string;
  emptyHint: string;
  /** The panel's least height, and the height the Markdown scrolls beyond. */
  minHeight?: number;
  maxHeight?: number;
  onCopy: () => void;
  onDownload: () => void;
}

type MarkdownContentProps = Omit<MarkdownOutputProps, 'minHeight'>;

const MarkdownContent: React.FC<Readonly<MarkdownContentProps>> = ({
  markdown,
  Icon,
  color,
  emptyTitle,
  emptyHint,
  maxHeight,
  onCopy,
  onDownload,
}) => {
  if (markdown === '') {
    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          color: 'text.secondary',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Icon sx={{ fontSize: 48, mb: 2, opacity: 0.3, color }} />
        <Typography variant="body1">{emptyTitle}</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            mt: 1,
          }}
        >
          {emptyHint}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
          }}
        >
          Converted Markdown
        </Typography>
        <Box>
          <Tooltip title="Copy">
            <IconButton size="small" onClick={onCopy}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" onClick={onDownload}>
              <Download fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ p: 2, maxHeight, overflow: 'auto' }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 13 }}>{markdown}</pre>
      </Box>
    </>
  );
};

/** The converted Markdown with its copy and download actions, or what to do to get some. */
const MarkdownOutput: React.FC<Readonly<MarkdownOutputProps>> = ({ minHeight = 400, maxHeight = 450, ...content }) => (
  <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%', minHeight }}>
    <MarkdownContent maxHeight={maxHeight} {...content} />
  </Paper>
);

export default MarkdownOutput;
