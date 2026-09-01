import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useTheme } from '../../shared/context/ThemeContext';
import Footer from '../../shared/components/Footer/Footer';
import { SecretsDrawer } from '../../shared/components/SecretsDrawer';
import { toolsData, getToolCounts, ToolItem, ToolCategory } from '../../shared/data/toolsData';
import { SITE_ORIGIN, SITE_NAME, DEFAULT_DESCRIPTION, BuiltMeta } from '../../shared/seo/buildMeta';
import { applyMeta } from '../../shared/seo/applyMeta';
import ToolsHeader from './ToolsHeader';
import HeroSection from './HeroSection';
import CategorySidebar from './CategorySidebar';
import CategoryChipRow from './CategoryChipRow';
import ToolsGrid from './ToolsGrid';
import EmptyState from './EmptyState';

const LANDING_TITLE = 'Free Online Tools — SEO, PDF, Image & AI | Exyconn Tools';
const LANDING_URL = `${SITE_ORIGIN}/tools`;

const LANDING_META: BuiltMeta = {
  title: LANDING_TITLE,
  description: DEFAULT_DESCRIPTION,
  canonical: LANDING_URL,
  keywords: 'free online tools, seo tools, pdf tools, image tools, ai tools, exyconn',
  ogTags: {
    'og:site_name': SITE_NAME,
    'og:type': 'website',
    'og:title': LANDING_TITLE,
    'og:description': DEFAULT_DESCRIPTION,
    'og:url': LANDING_URL,
  },
  twitterTags: {
    'twitter:card': 'summary',
    'twitter:title': LANDING_TITLE,
    'twitter:description': DEFAULT_DESCRIPTION,
  },
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: LANDING_URL,
      description: DEFAULT_DESCRIPTION,
    },
  ],
};

const filterBySearch = (categories: ToolCategory[], query: string): ToolCategory[] => {
  const q = query.toLowerCase();
  return categories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      ),
    }))
    .filter((cat) => cat.items.length > 0);
};

const ToolsPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [secretsOpen, setSecretsOpen] = useState(false);

  const toolCounts = getToolCounts();

  const filteredData = useMemo(() => {
    const byCategory = selectedCategory === 'All'
      ? toolsData
      : toolsData.filter((cat) => cat.category === selectedCategory);
    if (!searchQuery.trim()) return byCategory;
    return filterBySearch(byCategory, searchQuery);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    applyMeta(LANDING_META);
  }, []);

  const handleToolClick = (tool: ToolItem) => navigate(tool.url);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ToolsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} mode={mode}
        onToggleTheme={toggleTheme} onLogoClick={() => navigate('/tools')}
        onOpenSecrets={() => setSecretsOpen(true)} />
      {isMobile && (
        <CategoryChipRow selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      )}
      <Box sx={{ flex: 1, bgcolor: 'background.default', py: 3 }}>
        <Container maxWidth="xl">
          <HeroSection title="Exyconn Free Tools"
            subtitle="Powerful design, SEO, AI, and productivity tools. All free, all in one place."
            totalTools={toolCounts.total} categoryCount={toolCounts.categories} />
          <Grid container spacing={2}>
            {!isMobile && (
              <Grid size={{ md: 3, lg: 2.5 }}>
                <CategorySidebar selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory} />
              </Grid>
            )}
            <Grid size={{ xs: 12, md: 9, lg: 9.5 }}>
              {filteredData.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filteredData.map((category) => (
                    <ToolsGrid key={category.category} category={category}
                      onToolClick={handleToolClick} />
                  ))}
                </Box>
              ) : (
                <EmptyState />
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
      <SecretsDrawer open={secretsOpen} onClose={() => setSecretsOpen(false)} />
      <Footer />
    </Box>
  );
};

export default ToolsPage;
