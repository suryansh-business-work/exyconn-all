import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNext from '@mui/icons-material/NavigateNext';
import { fonts } from '../../../theme/tokens';

export interface Crumb {
  readonly label: string;
  /** Omitted for the current page. */
  readonly to?: string;
}

const crumbSx = {
  fontFamily: fonts.mono,
  fontSize: '0.72rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
} as const;

/** Mono breadcrumb trail; the last crumb is the current page. */
const Crumbs: React.FC<Readonly<{ items: readonly Crumb[] }>> = ({ items }) => (
  <Breadcrumbs
    aria-label="Breadcrumb"
    separator={<NavigateNext sx={{ fontSize: 14 }} />}
    sx={{ color: 'text.secondary', '& .MuiBreadcrumbs-li': { minWidth: 0 } }}
  >
    {items.map((item) =>
      item.to ? (
        <Link
          key={item.label}
          component={RouterLink}
          to={item.to}
          underline="hover"
          sx={{ ...crumbSx, color: 'text.secondary', display: 'inline-flex', alignItems: 'center', minHeight: 32 }}
        >
          {item.label}
        </Link>
      ) : (
        <Typography key={item.label} aria-current="page" noWrap sx={{ ...crumbSx, color: 'text.primary' }}>
          {item.label}
        </Typography>
      )
    )}
  </Breadcrumbs>
);

export default Crumbs;
