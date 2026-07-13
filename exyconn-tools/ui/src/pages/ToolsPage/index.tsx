import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useTheme } from '../../shared/context/ThemeContext';
import Footer from '../../shared/components/Footer/Footer';
import { SecretsDrawer } from '../../shared/components/SecretsDrawer';
import { toolsData, getToolCounts, ToolItem, ToolCategory } from '../../shared/data/toolsData';
import { StatusFilter } from './types';
import ToolsHeader from './ToolsHeader';
import HeroSection from './HeroSection';
import CategorySidebar from './CategorySidebar';
import StatsBar from './StatsBar';
import ToolsGrid from './ToolsGrid';
import EmptyState from './EmptyState';
import ToolDescriptionDrawer from './ToolDescriptionDrawer';

const ToolsPage: React.FC = () => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [secretsOpen, setSecretsOpen] = useState(false);
  const [descriptionTool, setDescriptionTool] = useState<ToolItem | null>(null);

  const toolCounts = getToolCounts();

  const filteredData = useMemo(() => {
    let filtered: ToolCategory[] = toolsData;
    if (selectedCategory !== 'All') {
      filtered = toolsData.filter((cat) => cat.category === selectedCategory);
    }
    if (statusFilter !== 'all') {
      filtered = filtered
        .map((cat) => ({
          ...cat,
          items: cat.items.filter((item) =>
            statusFilter === 'available' ? item.isActive : !item.isActive
          ),
        }))
        .filter((cat) => cat.items.length > 0);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered
        .map((cat) => ({
          ...cat,
          items: cat.items.filter(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              item.description.toLowerCase().includes(query)
          ),
        }))
        .filter((cat) => cat.items.length > 0);
    }
    return filtered;
  }, [searchQuery, selectedCategory, statusFilter]);

  useEffect(() => {
    document.title = 'Exyconn Free Tools \u2014 SEO, AI, Domain, PDF & Image Tools';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free online tools for SEO analysis, AI content generation, domain lookup, PDF conversion, image editing, sitemap management and more. No sign-up required.');
    }
  }, []);

  const handleToolClick = (tool: ToolItem) => {
    if (tool.isActive) navigate(tool.url);
  };

  const handleShowDescription = (tool: ToolItem) => {
    setDescriptionTool(tool);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ToolsHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} mode={mode}
        onToggleTheme={toggleTheme} onLogoClick={() => navigate('/tools')}
        onOpenSecrets={() => setSecretsOpen(true)} />
      <Box sx={{ flex: 1, bgcolor: 'background.default', py: 3 }}>
        <Container maxWidth="xl">
          <HeroSection title="Exyconn Free Tools"
            subtitle="Powerful design, SEO, AI, and productivity tools. All free, all in one place."
            totalTools={toolCounts.total} availableTools={toolCounts.available}
            comingSoonTools={toolCounts.comingSoon} />
          <StatsBar totalTools={toolCounts.total} availableTools={toolCounts.available}
            comingSoonTools={toolCounts.comingSoon} statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter} />
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
                      onToolClick={handleToolClick} onShowDescription={handleShowDescription} />
                  ))}
                </Box>
              ) : (
                <EmptyState />
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
      <ToolDescriptionDrawer open={!!descriptionTool} onClose={() => setDescriptionTool(null)} tool={descriptionTool} />
      <SecretsDrawer open={secretsOpen} onClose={() => setSecretsOpen(false)} />
      <Footer />
    </Box>
  );
};

export default ToolsPage;
