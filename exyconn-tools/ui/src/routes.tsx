import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import ToolsPage from './pages/ToolsPage';
import NotFoundPage from './pages/NotFoundPage';
import { getAllTools } from './shared/data/toolsData';

const Loading: React.FC = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
);

/**
 * Tool pages are discovered from the filesystem: every `src/tools/<id>/index.tsx`
 * is lazy-loadable here, and the route table derives from the tool registry
 * (toolsData) — a tool exists as a route iff it is registered AND its folder
 * exists. Registry <-> folder consistency is enforced by unit tests.
 */
const toolModules = import.meta.glob('./tools/*/index.tsx') as Record<
  string,
  () => Promise<{ default: React.ComponentType }>
>;

const toolRoutes = getAllTools()
  .map((tool) => {
    const loader = toolModules[`./tools/${tool.id}/index.tsx`];
    return loader ? { path: tool.id, Component: React.lazy(loader) } : null;
  })
  .filter((route): route is { path: string; Component: React.LazyExoticComponent<React.ComponentType> } => route !== null);

const AppRoutes: React.FC = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/" element={<ToolsPage />} />
      <Route path="/tools" element={<ToolsPage />} />
      {toolRoutes.map(({ path, Component }) => (
        <Route key={path} path={`/tools/${path}`} element={<Component />} />
      ))}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
