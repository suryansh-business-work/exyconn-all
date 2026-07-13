import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import type { Branding } from '@shared/types';
import { glass } from '../theme';
import BrandMark from './BrandMark';

interface Props {
  branding: Branding | null;
  title: string;
  onOpenMenu: () => void;
}

/** Frosted top bar: hamburger, brand logo, and the current section name. */
export default function GlassAppBar({ branding, title, onOpenMenu }: Readonly<Props>): JSX.Element {
  return (
    <AppBar
      position="static"
      color="transparent"
      sx={(theme) => ({
        ...glass(theme, 0.07),
        borderRadius: 0,
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        boxShadow: 'none',
        color: theme.palette.text.primary,
      })}
    >
      {/* The window is narrow: the brand shrinks (minWidth 0) so the section name never
          spills past the right edge, and the section name itself never shrinks. */}
      <Toolbar
        variant="dense"
        disableGutters
        sx={{ gap: 1, minHeight: 46, px: 1, overflow: 'hidden' }}
      >
        <IconButton
          edge="start"
          size="small"
          color="inherit"
          aria-label="Open navigation"
          onClick={onOpenMenu}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: '1 1 auto', minWidth: 0, display: 'flex' }}>
          <BrandMark branding={branding} height={20} />
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ flex: '0 0 auto', maxWidth: '50%', fontWeight: 600 }}
        >
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
