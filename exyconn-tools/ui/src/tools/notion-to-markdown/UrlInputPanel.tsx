import React from 'react';
import { Paper, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { Bookmark } from '@mui/icons-material';

interface UrlInputPanelProps {
  url: string;
  loading: boolean;
  title: string;
  onUrlChange: (value: string) => void;
  onConvert: () => void;
}

const UrlInputPanel: React.FC<UrlInputPanelProps> = ({
  url,
  loading,
  title,
  onUrlChange,
  onConvert,
}) => {
  return (
    <>
      <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Notion Page URL
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="https://www.notion.so/your-page-id"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onConvert()}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Enter a public Notion page URL to convert to Markdown
        </Typography>
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Note:</strong> Only public Notion pages can be converted. Make sure your page is shared
          publicly.
        </Typography>
      </Alert>

      <Button
        fullWidth
        variant="contained"
        onClick={onConvert}
        disabled={!url.trim() || loading}
        startIcon={loading ? <CircularProgress size={16} /> : <Bookmark />}
        sx={{ mt: 2, bgcolor: '#000000', '&:hover': { bgcolor: '#333333' } }}
      >
        {loading ? 'Fetching & Converting...' : 'Convert Notion Page'}
      </Button>

      {title && (
        <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Page Title
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {title}
          </Typography>
        </Paper>
      )}
    </>
  );
};

export default UrlInputPanel;
