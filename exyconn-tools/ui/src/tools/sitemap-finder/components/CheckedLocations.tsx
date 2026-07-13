import React, { useState } from 'react';
import { Box, Typography, IconButton, Collapse } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

interface CheckedLocationsProps {
  locations: string[];
}

const CheckedLocations: React.FC<CheckedLocationsProps> = ({ locations }) => {
  const [showCheckedLocations, setShowCheckedLocations] = useState(false);

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
        }}
        onClick={() => setShowCheckedLocations(!showCheckedLocations)}
      >
        <Typography variant="body2" color="text.secondary">
          Checked {locations.length} locations
        </Typography>
        <IconButton size="small">
          {showCheckedLocations ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={showCheckedLocations}>
        <Box sx={{ mt: 1, pl: 2, borderLeft: 2, borderColor: 'divider' }}>
          {locations.map((loc, idx) => (
            <Typography
              key={idx}
              variant="caption"
              sx={{ display: 'block', fontFamily: 'monospace', color: 'text.secondary' }}
            >
              {loc}
            </Typography>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default CheckedLocations;
