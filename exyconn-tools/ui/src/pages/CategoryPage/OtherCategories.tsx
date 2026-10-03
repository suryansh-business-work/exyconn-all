import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import StageLabel from '../../shared/components/Shell/StageLabel';
import { toolsData } from '../../shared/data/toolsData';
import { categoryPath } from '../../shared/seo/site';
import { radii } from '../../shared/theme/tokens';

/** Links to every other category, so a category page is never a dead end. */
const OtherCategories: React.FC<Readonly<{ currentSlug: string }>> = ({ currentSlug }) => (
  <Box component="nav" aria-labelledby="other-categories">
    <Typography id="other-categories" component="h2" sx={{ mb: 2 }}>
      <StageLabel component="span" tick>
        More categories
      </StageLabel>
    </Typography>
    <Box
      component="ul"
      sx={{
        listStyle: 'none',
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' },
      }}
    >
      {toolsData
        .filter((category) => category.slug !== currentSlug)
        .map((category) => (
          <li key={category.slug}>
            <Box
              component={RouterLink}
              to={categoryPath(category.slug)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                minHeight: 56,
                px: 2,
                borderRadius: radii.card,
                border: 1,
                borderColor: 'divider',
                color: 'text.primary',
                textDecoration: 'none',
                '&:hover, &:focus-visible': { borderColor: category.color },
              }}
            >
              <Box
                component={category.icon}
                aria-hidden
                sx={{ width: 18, height: 18, color: category.color, flexShrink: 0 }}
              />
              <Typography sx={{ fontWeight: 600, flex: 1 }}>{category.category}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {category.items.length}
              </Typography>
            </Box>
          </li>
        ))}
    </Box>
  </Box>
);

export default OtherCategories;
