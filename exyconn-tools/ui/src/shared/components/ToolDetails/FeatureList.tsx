import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CheckCircleOutlineOutlined from '@mui/icons-material/CheckCircleOutlineOutlined';

/** Feature bullets in a two-column grid on wider screens. */
const FeatureList: React.FC<Readonly<{ features: readonly string[]; color: string }>> = ({ features, color }) => (
  <Box
    component="ul"
    sx={{
      listStyle: 'none',
      display: 'grid',
      gap: 1.5,
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))' },
    }}
  >
    {features.map((feature) => (
      <Box component="li" key={feature} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
        <CheckCircleOutlineOutlined aria-hidden sx={{ fontSize: 20, mt: '2px', color }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {feature}
        </Typography>
      </Box>
    ))}
  </Box>
);

export default FeatureList;
