import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import NightBand from '../../shared/components/Shell/NightBand';
import StageLabel from '../../shared/components/Shell/StageLabel';
import Crumbs from '../../shared/components/Shell/Crumbs';
import { displaySx } from '../../shared/components/Shell/styles';
import SceneCanvas from '../../shared/three/SceneCanvas';
import type { ToolCategory } from '../../shared/data/toolsData';
import { HUB_PATH } from '../../shared/seo/site';

/** Category page header: breadcrumb, icon tile, condensed title, summary, count. */
const CategoryHero: React.FC<Readonly<{ category: ToolCategory }>> = ({ category }) => (
  <NightBand
    label={category.category}
    backdrop={<SceneCanvas variant="band" />}
    sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 5, md: 7 } }}
  >
    <Crumbs items={[{ label: 'Tools', to: HUB_PATH }, { label: category.category }]} />
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: { xs: 3, md: 5 } }}>
      <Box
        sx={{
          width: 56,
          height: 56,
          flexShrink: 0,
          borderRadius: '16px',
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha(category.color, 0.18),
          border: `1px solid ${alpha(category.color, 0.5)}`,
          boxShadow: `0 0 32px ${alpha(category.color, 0.35)}`,
        }}
      >
        <Box component={category.icon} aria-hidden sx={{ width: 26, height: 26, color: category.color }} />
      </Box>
      <StageLabel tick>{category.items.length} free tools</StageLabel>
    </Box>
    <Typography
      component="h1"
      sx={{ ...displaySx, fontSize: { xs: '2.3rem', sm: '3rem', md: '4rem' }, mt: 2.5, maxWidth: 900 }}
    >
      {category.category}
    </Typography>
    <Typography sx={{ color: 'text.secondary', fontSize: { xs: '1rem', md: '1.12rem' }, mt: 2, maxWidth: 680 }}>
      {category.description}
    </Typography>
  </NightBand>
);

export default CategoryHero;
