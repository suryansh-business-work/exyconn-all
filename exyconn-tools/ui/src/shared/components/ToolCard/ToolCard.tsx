import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import ArrowOutward from '@mui/icons-material/ArrowOutward';
import type { ToolItem } from '../../data/toolsData';
import { radii } from '../../theme/tokens';

interface ToolCardProps {
  tool: ToolItem;
  /** Heading level of the tool name inside the surrounding section. */
  headingComponent?: 'h2' | 'h3' | 'h4';
}

/** A tool in a grid: the whole card is one link to the tool page. */
const ToolCard: React.FC<Readonly<ToolCardProps>> = ({ tool, headingComponent = 'h3' }) => (
  <Box
    component={RouterLink}
    to={tool.url}
    sx={(theme) => ({
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.5,
      height: '100%',
      minHeight: 148,
      p: 2,
      borderRadius: radii.card,
      border: 1,
      borderColor: 'divider',
      bgcolor: 'background.paper',
      color: 'text.primary',
      textDecoration: 'none',
      overflow: 'hidden',
      transition: 'border-color .2s ease, transform .2s ease, box-shadow .2s ease',
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: 'auto -30% -60% auto',
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(tool.color, 0.22)}, transparent 70%)`,
        opacity: 0,
        transition: 'opacity .25s ease',
      },
      '&:hover, &:focus-visible': {
        borderColor: alpha(tool.color, 0.7),
        transform: 'translateY(-2px)',
        boxShadow: `0 12px 32px ${alpha(tool.color, theme.palette.mode === 'dark' ? 0.25 : 0.16)}`,
      },
      '&:hover::after, &:focus-visible::after': { opacity: 1 },
      '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
      '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
    })}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '12px',
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha(tool.color, 0.14),
          border: `1px solid ${alpha(tool.color, 0.35)}`,
        }}
      >
        <Box component={tool.icon} aria-hidden sx={{ width: 20, height: 20, color: tool.color }} />
      </Box>
      <ArrowOutward aria-hidden sx={{ fontSize: 18, color: 'text.secondary' }} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography component={headingComponent} sx={{ fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.3, mb: 0.5 }}>
        {tool.name}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {tool.description}
      </Typography>
    </Box>
  </Box>
);

export default ToolCard;
