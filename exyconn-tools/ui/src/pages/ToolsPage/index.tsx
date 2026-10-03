import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppHeader from '../../shared/components/Shell/AppHeader';
import Footer from '../../shared/components/Footer/Footer';
import StageLabel from '../../shared/components/Shell/StageLabel';
import { gutterSx, SHELL_MAX_WIDTH } from '../../shared/components/Shell/styles';
import { toolsData } from '../../shared/data/toolsData';
import HubHero from './HubHero';
import CategorySection from './CategorySection';
import EmptyState from './EmptyState';
import { filterCategories } from './filterTools';

/** Tools previewed per category on the hub before "View all". */
const PREVIEW_COUNT = 8;

/** The tools hub (`/` and `/tools`): hero with live search, then every category. */
const ToolsPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const categories = React.useMemo(() => filterCategories(toolsData, query), [query]);
  const matches = categories.reduce((sum, category) => sum + category.items.length, 0);

  const setQuery = (next: string) => setParams(next ? { q: next } : {}, { replace: true });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader showSearch={false} />
      <Box component="main" sx={{ flex: 1 }}>
        <HubHero query={query} onQueryChange={setQuery} />
        <Box sx={{ maxWidth: SHELL_MAX_WIDTH, mx: 'auto', py: { xs: 5, md: 8 }, ...gutterSx }}>
          {query && (
            <Box role="status" sx={{ mb: 4 }}>
              <StageLabel tick>
                {matches} {matches === 1 ? 'match' : 'matches'} for “{query}”
              </StageLabel>
            </Box>
          )}
          {categories.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 6, md: 9 } }}>
              {categories.map((category, index) => (
                <CategorySection
                  key={category.slug}
                  category={category}
                  index={index + 1}
                  limit={query ? undefined : PREVIEW_COUNT}
                />
              ))}
            </Box>
          ) : (
            <EmptyState query={query} onClear={() => setQuery('')} />
          )}
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default ToolsPage;
