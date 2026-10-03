import React from 'react';
import Box from '@mui/material/Box';
import type { ToolItem } from '../../data/toolsData';
import ToolCard from './ToolCard';

interface ToolGridProps {
  tools: readonly ToolItem[];
  headingComponent?: 'h2' | 'h3' | 'h4';
}

/** Responsive tool grid: 1 column on phones up to 4 on wide screens. */
const ToolGrid: React.FC<Readonly<ToolGridProps>> = ({ tools, headingComponent }) => (
  <Box
    component="ul"
    sx={{
      listStyle: 'none',
      display: 'grid',
      gap: { xs: 1.5, md: 2 },
      gridTemplateColumns: {
        xs: 'minmax(0, 1fr)',
        sm: 'repeat(2, minmax(0, 1fr))',
        md: 'repeat(3, minmax(0, 1fr))',
        lg: 'repeat(4, minmax(0, 1fr))',
      },
    }}
  >
    {tools.map((tool) => (
      <li key={tool.id}>
        <ToolCard tool={tool} headingComponent={headingComponent} />
      </li>
    ))}
  </Box>
);

export default ToolGrid;
