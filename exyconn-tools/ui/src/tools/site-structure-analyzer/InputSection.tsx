import React from 'react';
import { Paper, Box, Typography, TextField, Button, CircularProgress, Slider, LinearProgress } from '@mui/material';
import { AccountTree, Language } from '@mui/icons-material';

interface InputSectionProps {
  websiteUrl: string;
  maxPages: number;
  isLoading: boolean;
  onUrlChange: (value: string) => void;
  onMaxPagesChange: (value: number) => void;
  onAnalyze: () => void;
}

const InputSection: React.FC<InputSectionProps> = ({
  websiteUrl,
  maxPages,
  isLoading,
  onUrlChange,
  onMaxPagesChange,
  onAnalyze,
}) => {
  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Language color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Enter Website URL
        </Typography>
      </Box>
      <TextField
        fullWidth
        size="small"
        placeholder="https://example.com"
        value={websiteUrl}
        onChange={(e) => onUrlChange(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Typography variant="caption" color="text.secondary" gutterBottom display="block">
        Max Pages to Analyze: {maxPages}
      </Typography>
      <Slider
        value={maxPages}
        onChange={(_, v) => onMaxPagesChange(v as number)}
        min={10}
        max={50}
        step={5}
        marks
        size="small"
        sx={{ mb: 2 }}
      />
      <Button
        fullWidth
        variant="contained"
        color="success"
        onClick={onAnalyze}
        disabled={isLoading || !websiteUrl.trim()}
        startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <AccountTree />}
      >
        {isLoading ? 'Analyzing...' : 'Analyze Structure'}
      </Button>
      {isLoading && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Crawling and analyzing site structure...
          </Typography>
          <LinearProgress color="success" sx={{ mt: 1 }} />
        </Box>
      )}
    </Paper>
  );
};

export default InputSection;
