import React from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppHeader from '../../shared/components/Shell/AppHeader';
import Footer from '../../shared/components/Footer/Footer';
import { gutterSx, SHELL_MAX_WIDTH } from '../../shared/components/Shell/styles';
import { ToolGrid } from '../../shared/components/ToolCard';
import { findCategoryBySlug } from '../../shared/data/toolsData';
import NotFoundPage from '../NotFoundPage';
import CategoryHero from './CategoryHero';
import OtherCategories from './OtherCategories';

/** `/categories/:slug` — one category's tools, then links to the rest. */
const CategoryPage: React.FC = () => {
  const { slug = '' } = useParams();
  const category = findCategoryBySlug(slug);
  if (!category) {
    return <NotFoundPage />;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader />
      <Box component="main" sx={{ flex: 1 }}>
        <CategoryHero category={category} />
        <Box
          sx={{
            maxWidth: SHELL_MAX_WIDTH,
            mx: 'auto',
            py: { xs: 5, md: 8 },
            display: 'grid',
            gap: { xs: 7, md: 10 },
            ...gutterSx,
          }}
        >
          <ToolGrid tools={category.items} headingComponent="h2" />
          <OtherCategories currentSlug={category.slug} />
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default CategoryPage;
