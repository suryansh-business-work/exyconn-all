import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import SearchOff from '@mui/icons-material/SearchOff';

/** Shown when a search matches no tool. */
const EmptyState: React.FC<Readonly<{ query: string; onClear: () => void }>> = ({ query, onClear }) => (
  <Box role="status" sx={{ textAlign: 'center', py: 10 }}>
    <SearchOff aria-hidden sx={{ fontSize: 48, color: 'text.secondary' }} />
    <Typography variant="h6" component="p" sx={{ mt: 2 }}>
      No tools match “{query}”
    </Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
      Try a shorter word, or browse the categories above.
    </Typography>
    <Button variant="outlined" onClick={onClear} sx={{ mt: 3, minHeight: 44 }}>
      Clear search
    </Button>
  </Box>
);

export default EmptyState;
