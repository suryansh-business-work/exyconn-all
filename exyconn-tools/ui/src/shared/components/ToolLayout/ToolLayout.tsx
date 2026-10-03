import React from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppHeader from '../Shell/AppHeader';
import Footer from '../Footer/Footer';
import OwnThisTool from '../OwnThisTool/OwnThisTool';
import ToolDetails from '../ToolDetails/ToolDetails';
import { findToolById, getCategoryOfTool } from '../../data/toolsData';
import { HUB_PATH, categoryPath } from '../../seo/site';
import type { Crumb } from '../Shell/Crumbs';
import ToolHero from './ToolHero';
import { SHELL_MAX_WIDTH } from '../Shell/styles';

interface ToolLayoutProps {
  children: React.ReactNode;
  toolName: string;
  toolIcon: React.ReactNode;
  toolColor: string;
  isMVP?: boolean;
  actions?: React.ReactNode;
}

/**
 * The frame every tool renders in: shared header, night hero with a particle band, the
 * tool's own UI, then details (about, how-to, FAQ, related), the source-code offer and the
 * footer. Page meta is not set here — RouteSeo applies it for every route.
 */
const ToolLayout: React.FC<Readonly<ToolLayoutProps>> = ({
  children,
  toolName,
  toolIcon,
  toolColor,
  isMVP = false,
  actions,
}) => {
  const { pathname } = useLocation();
  const toolId = pathname.split('/').pop() ?? '';
  const tool = findToolById(toolId);
  const category = getCategoryOfTool(toolId);

  const crumbs: Crumb[] = [
    { label: 'Tools', to: HUB_PATH },
    ...(category ? [{ label: category.category, to: categoryPath(category.slug) }] : []),
    { label: toolName },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader />
      <Box component="main" sx={{ flex: 1, bgcolor: 'background.default' }}>
        <ToolHero
          name={toolName}
          icon={toolIcon}
          color={toolColor}
          crumbs={crumbs}
          description={tool?.description}
          isMVP={isMVP}
          actions={actions}
        />
        {/* Narrower than the shell by the gutter difference (32px vs the tools' own 24px
            Container padding), so tool UIs line up with the hero column. */}
        <Box sx={{ maxWidth: SHELL_MAX_WIDTH - 16, mx: 'auto', py: { xs: 1, md: 2 } }}>{children}</Box>
      </Box>
      <ToolDetails toolId={toolId} />
      <OwnThisTool toolId={toolId} />
      <Footer />
    </Box>
  );
};

export default ToolLayout;
