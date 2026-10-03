import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ArrowForward from '@mui/icons-material/ArrowForward';
import StageLabel from '../../shared/components/Shell/StageLabel';
import { displaySx } from '../../shared/components/Shell/styles';
import { ToolGrid } from '../../shared/components/ToolCard';
import { categoryPath } from '../../shared/seo/site';
import type { CategorySectionProps } from './types';

/** One category on the hub: mono index, condensed title, its tools, and a link to its page. */
const CategorySection: React.FC<Readonly<CategorySectionProps>> = ({ category, index, limit }) => {
  const headingId = `category-${category.slug}`;
  const shown = limit ? category.items.slice(0, limit) : category.items;
  return (
    <Box component="section" aria-labelledby={headingId} sx={{ scrollMarginTop: 80 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 2,
          mb: 2.5,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <StageLabel tick>
            {String(index).padStart(2, '0')} · {category.items.length} tools
          </StageLabel>
          <Typography
            id={headingId}
            component="h2"
            sx={{ ...displaySx, fontSize: { xs: '1.7rem', md: '2.3rem' }, mt: 1 }}
          >
            {category.category}
          </Typography>
        </Box>
        <Button
          component={RouterLink}
          to={categoryPath(category.slug)}
          endIcon={<ArrowForward />}
          aria-label={`All ${category.category}`}
          sx={{ minHeight: 44 }}
        >
          View all {category.items.length}
        </Button>
      </Box>
      <ToolGrid tools={shown} />
    </Box>
  );
};

export default CategorySection;
