import React from 'react';
import { Paper, Typography, TextField, Button } from '@mui/material';

interface BulkUrlInputProps {
  bulkUrls: string;
  onBulkUrlsChange: (value: string) => void;
  onParseBulkUrls: () => void;
}

const BulkUrlInput: React.FC<BulkUrlInputProps> = ({
  bulkUrls,
  onBulkUrlsChange,
  onParseBulkUrls,
}) => (
  <Paper elevation={0} sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
      Bulk Add URLs
    </Typography>
    <TextField
      fullWidth
      multiline
      rows={3}
      size="small"
      placeholder="Paste URLs (one per line)"
      value={bulkUrls}
      onChange={(e) => onBulkUrlsChange(e.target.value)}
      sx={{ mb: 1 }}
    />
    <Button size="small" onClick={onParseBulkUrls} disabled={!bulkUrls.trim()}>
      Add URLs
    </Button>
  </Paper>
);

export default BulkUrlInput;
