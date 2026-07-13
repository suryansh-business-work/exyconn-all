import React from 'react';
import { Box, Paper, Typography, IconButton, Tooltip, Chip, Stack } from '@mui/material';
import { ContentCopy, CheckCircle, AutoAwesome, Token } from '@mui/icons-material';
import { TokenUsage } from '../../services/openai';

interface AIResultDisplayProps {
  result: string;
  title?: string;
  tokenUsage?: TokenUsage;
}

const AIResultDisplay: React.FC<AIResultDisplayProps> = ({ result, title = 'Generated Result', tokenUsage }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result) return null;

  return (
    <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
          <IconButton size="small" onClick={handleCopy}>
            {copied ? <CheckCircle color="success" fontSize="small" /> : <ContentCopy fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
          {result}
        </Typography>
      </Box>
      {tokenUsage && (
        <Box sx={{ px: 2, pb: 1.5, borderTop: 1, borderColor: 'divider', pt: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Token sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Chip label={`Prompt: ${tokenUsage.promptTokens}`} size="small" variant="outlined" sx={{ height: 22 }} />
            <Chip
              label={`Output: ${tokenUsage.completionTokens}`}
              size="small"
              variant="outlined"
              sx={{ height: 22 }}
            />
            <Chip label={`Total: ${tokenUsage.totalTokens}`} size="small" color="primary" sx={{ height: 22 }} />
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default AIResultDisplay;
