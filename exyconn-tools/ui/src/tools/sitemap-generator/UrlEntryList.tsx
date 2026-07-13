import React from 'react';
import { Paper, Box, Typography, TextField, Button, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { UrlEntry } from './types';

interface UrlEntryListProps {
  urls: UrlEntry[];
  onAddUrl: () => void;
  onRemoveUrl: (id: string) => void;
  onUpdateUrl: (id: string, field: keyof UrlEntry, value: string | number) => void;
}

const UrlEntryList: React.FC<UrlEntryListProps> = ({
  urls,
  onAddUrl,
  onRemoveUrl,
  onUpdateUrl,
}) => (
  <Paper
    elevation={0}
    sx={{ p: 2, mt: 2, border: 1, borderColor: 'divider', borderRadius: 2, maxHeight: 280, overflow: 'auto' }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        URLs ({urls.length})
      </Typography>
      <Button size="small" startIcon={<Add />} onClick={onAddUrl}>
        Add
      </Button>
    </Box>
    {urls.map((url, index) => (
      <Box key={url.id} sx={{ mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>
            #{index + 1}
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="https://example.com/page"
            value={url.loc}
            onChange={(e) => onUpdateUrl(url.id, 'loc', e.target.value)}
          />
          <IconButton size="small" onClick={() => onRemoveUrl(url.id)} disabled={urls.length === 1}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    ))}
  </Paper>
);

export default UrlEntryList;
