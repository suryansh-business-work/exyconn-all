import React from 'react';
import { Box, Typography, TextField, Button, IconButton } from '@mui/material';
import { Add, Delete } from '@mui/icons-material';

interface SitemapEntry {
  id: string;
  loc: string;
  lastmod: string;
}

interface SitemapEntryListProps {
  sitemaps: SitemapEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof SitemapEntry, value: string) => void;
}

const SitemapEntryList: React.FC<SitemapEntryListProps> = ({ sitemaps, onAdd, onRemove, onUpdate }) => (
  <>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        Sitemap Files ({sitemaps.length})
      </Typography>
      <Button size="small" startIcon={<Add />} onClick={onAdd}>
        Add
      </Button>
    </Box>

    <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
      {sitemaps.map((sitemap, index) => (
        <Box key={sitemap.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" fontWeight={600}>
              Sitemap #{index + 1}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <IconButton
              size="small"
              onClick={() => onRemove(sitemap.id)}
              disabled={sitemaps.length === 1}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            size="small"
            label="Sitemap URL"
            placeholder="https://example.com/sitemap-1.xml"
            value={sitemap.loc}
            onChange={(e) => onUpdate(sitemap.id, 'loc', e.target.value)}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            size="small"
            label="Last Modified"
            type="date"
            value={sitemap.lastmod}
            onChange={(e) => onUpdate(sitemap.id, 'lastmod', e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      ))}
    </Box>
  </>
);

export default SitemapEntryList;
