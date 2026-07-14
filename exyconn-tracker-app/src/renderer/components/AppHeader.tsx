import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import type { Branding } from '@shared/types';
import BrandMark from './BrandMark';

interface Props {
  branding: Branding | null;
  title: string;
  onOpenMenu: () => void;
}

/** Compact top bar: hamburger, brand logo, and the current section name. */
export default function AppHeader({ branding, title, onOpenMenu }: Readonly<Props>): JSX.Element {
  return (
    <AppBar
      position="static"
      color="transparent"
      sx={(theme) => ({
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        boxShadow: 'none',
        color: theme.palette.text.primary,
      })}
    >
      {/* Both text runs shrink (minWidth 0) and truncate. The window is narrow enough that a
          non-shrinking child would push the section name off the right edge — it used to. */}
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
          sx={{ flexShrink: 0 }}
        >
          <MenuIcon fontSize="small" />
        </IconButton>

        <Box sx={{ display: 'flex', flex: '0 1 auto', minWidth: 0 }}>
          <BrandMark branding={branding} height={20} />
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          sx={{ flex: '1 1 auto', minWidth: 0, textAlign: 'right', fontWeight: 600 }}
        >
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
