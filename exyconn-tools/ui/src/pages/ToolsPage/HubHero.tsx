import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import NightBand from '../../shared/components/Shell/NightBand';
import StageLabel from '../../shared/components/Shell/StageLabel';
import AccentText from '../../shared/components/Shell/AccentText';
import { displaySx, glassSx } from '../../shared/components/Shell/styles';
import SceneCanvas from '../../shared/three/SceneCanvas';
import { toolsData, getToolCounts } from '../../shared/data/toolsData';
import { categoryPath } from '../../shared/seo/site';
import HubSearch from './HubSearch';
import type { HubSearchProps } from './types';

/** The hub's opening band: headline, live search, stats and category shortcuts over the cube field. */
const HubHero: React.FC<Readonly<Omit<HubSearchProps, 'total'>>> = ({ query, onQueryChange }) => {
  const { total, categories } = getToolCounts();
  const stats = [
    { label: 'Tools', value: String(total) },
    { label: 'Categories', value: String(categories) },
    // A promise, not a metric: "Signups 0" read as nobody having signed up.
    { label: 'Sign-up needed', value: 'No' },
  ];

  return (
    <NightBand
      label="Exyconn free tools"
      backdrop={<SceneCanvas variant="hub" />}
      sx={{ pt: { xs: 6, md: 11 }, pb: { xs: 5, md: 9 } }}
    >
      <Box sx={{ maxWidth: 760 }}>
        <StageLabel tick>Exyconn · Free online tools</StageLabel>
        <Typography component="h1" sx={{ ...displaySx, fontSize: { xs: '2.6rem', sm: '3.6rem', md: '5rem' }, mt: 2.5 }}>
          Free tools that <AccentText>do the work</AccentText>
        </Typography>
        <Typography
          sx={{ color: 'text.secondary', fontSize: { xs: '1.02rem', md: '1.15rem' }, mt: 2.5, maxWidth: 600 }}
        >
          {total} SEO, PDF, image, domain and AI tools in one place. Files stay in your browser, results arrive in
          seconds, and nothing asks you to sign up.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <HubSearch query={query} onQueryChange={onQueryChange} total={total} />
        </Box>
        <Box
          component="dl"
          sx={{ ...glassSx, mt: 3, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: 480 }}
        >
          {stats.map((stat, index) => (
            <Box
              key={stat.label}
              sx={{ px: 2, py: 1.75, textAlign: 'center', borderLeft: index ? 1 : 0, borderColor: 'divider' }}
            >
              <Box component="dt" sx={{ display: 'flex', justifyContent: 'center' }}>
                <StageLabel component="span">{stat.label}</StageLabel>
              </Box>
              <Typography
                component="dd"
                sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.9rem' }, lineHeight: 1.2, mt: 0.5 }}
              >
                {stat.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Box
        component="nav"
        aria-label="Categories"
        sx={{
          mt: { xs: 4, md: 6 },
          mx: { xs: -2, sm: 0 },
          px: { xs: 2, sm: 0 },
          display: 'flex',
          flexWrap: { xs: 'nowrap', sm: 'wrap' },
          overflowX: { xs: 'auto', sm: 'visible' },
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          gap: 1,
        }}
      >
        {toolsData.map((category) => (
          <Chip
            key={category.slug}
            component={RouterLink}
            to={categoryPath(category.slug)}
            clickable
            label={category.category}
            icon={
              <Box
                component={category.icon}
                aria-hidden
                sx={{ width: 14, height: 14, color: `${category.color} !important` }}
              />
            }
            sx={{ ...glassSx, borderRadius: '999px', height: 44, px: 0.5, fontSize: '0.85rem', flexShrink: 0 }}
          />
        ))}
      </Box>
    </NightBand>
  );
};

export default HubHero;
