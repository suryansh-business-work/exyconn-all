import React from 'react';
import { Paper, Box, Typography, TextField, Button, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { useStableKeys } from './useStableKeys';

interface SitemapUrlsSectionProps {
  sitemaps: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, value: string) => void;
}

const SitemapUrlsSection: React.FC<SitemapUrlsSectionProps> = ({ sitemaps, onAdd, onRemove, onUpdate }) => {
  const { keys, removeKey } = useStableKeys(sitemaps.length);
  const handleRemove = (index: number) => {
    removeKey(index);
    onRemove(index);
  };
  const items = sitemaps.map((sitemap, index) => ({ sitemap, index, key: keys[index] }));
  return (
    <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 600,
          }}
        >
          Sitemap URLs
        </Typography>
        <Button size="small" startIcon={<Add />} onClick={onAdd}>
          Add
        </Button>
      </Box>
      {items.map(({ sitemap, index, key }) => (
        <Box key={key} sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="https://example.com/sitemap.xml"
            value={sitemap}
            onChange={(e) => onUpdate(index, e.target.value)}
          />
          <IconButton size="small" onClick={() => handleRemove(index)} disabled={sitemaps.length === 1}>
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ))}
    </Paper>
  );
};

export default SitemapUrlsSection;
