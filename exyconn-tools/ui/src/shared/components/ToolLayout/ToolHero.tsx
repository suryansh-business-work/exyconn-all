import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import NightBand from '../Shell/NightBand';
import Crumbs, { type Crumb } from '../Shell/Crumbs';
import { displaySx } from '../Shell/styles';
import SceneCanvas from '../../three/SceneCanvas';
import { neon } from '../../theme/tokens';

export interface ToolHeroProps {
  name: string;
  icon: React.ReactNode;
  color: string;
  crumbs: readonly Crumb[];
  description?: string;
  isMVP?: boolean;
  actions?: React.ReactNode;
}

/** Compact night header over a particle band: trail, icon tile, tool name, summary, actions. */
const ToolHero: React.FC<Readonly<ToolHeroProps>> = ({ name, icon, color, crumbs, description, isMVP, actions }) => (
  <NightBand
    label={name}
    backdrop={<SceneCanvas variant="band" />}
    sx={{ pt: { xs: 2.5, md: 3.5 }, pb: { xs: 4, md: 5 } }}
  >
    <Crumbs items={crumbs} />
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', md: 'flex-end' },
        gap: { xs: 2, md: 3 },
        mt: { xs: 2.5, md: 3.5 },
        flexDirection: { xs: 'column', md: 'row' },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: { xs: 48, md: 60 },
              height: { xs: 48, md: 60 },
              flexShrink: 0,
              borderRadius: '16px',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.6)})`,
              boxShadow: `0 0 36px ${alpha(color, 0.45)}`,
              '& svg': { fontSize: { xs: 24, md: 30 } },
            }}
          >
            {icon}
          </Box>
          <Typography
            component="h1"
            sx={{
              ...displaySx,
              fontSize: { xs: '1.8rem', sm: '2.3rem', md: '3rem' },
              overflowWrap: 'anywhere',
              minWidth: 0,
            }}
          >
            {name}
            {isMVP && (
              <Chip
                label="MVP"
                size="small"
                sx={{ ml: 1.5, verticalAlign: 'middle', bgcolor: neon.orange, color: '#1a0d00', fontWeight: 800 }}
              />
            )}
          </Typography>
        </Box>
        {description && (
          <Typography
            sx={{ color: 'text.secondary', mt: 2, maxWidth: 720, fontSize: { xs: '0.98rem', md: '1.05rem' } }}
          >
            {description}
          </Typography>
        )}
      </Box>
      {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  </NightBand>
);

export default ToolHero;
