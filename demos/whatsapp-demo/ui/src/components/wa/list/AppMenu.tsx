import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { IconButton, ListItemIcon, Menu, MenuItem } from '@exyconn/shell/components/ui';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoIcon from '@mui/icons-material/InfoOutlined';
import HelpIcon from '@mui/icons-material/HelpOutlineOutlined';
import ContrastIcon from '@mui/icons-material/Contrast';
import InsightsIcon from '@mui/icons-material/Insights';
import AppsIcon from '@mui/icons-material/Apps';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@exyconn/shell/auth/AuthContext';
import { canAccess, ROLES } from '@exyconn/shell/auth/roles';
import { HUB_URL } from '@exyconn/shell/config/apps';
import { useColorMode } from '@exyconn/shell/theme/ColorModeContext';
import { AboutDialog } from './AboutDialog';
import { GuideDialog } from './GuideDialog';
import { guideSeen, markGuideSeen } from './guideSeen';
import { clearVisitorPass } from '@exyconn/demo-visitor';

/**
 * The chat list's ⋮ menu — the guide to the demo, and the only way out of it: back to the portal, or sign out. A demo
 * visitor (email-and-code sign-in) has no portal to go back to; signing out drops their pass.
 */
export function AppMenu({ color }: Readonly<{ color: string }>) {
  const t = useT();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { mode, toggle } = useColorMode();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [about, setAbout] = useState(false);
  // A first-time visitor gets the guide before their first chat; it stays a menu item after.
  const [guide, setGuide] = useState(() => !guideSeen());
  const closeGuide = () => {
    markGuideSeen();
    setGuide(false);
  };
  const close = () => setAnchor(null);
  const isAdmin = user ? canAccess(user.roles, ROLES.ADMIN) : false;
  const handleSignOut = () => {
    close();
    if (user) {
      signOut();
      return;
    }
    clearVisitorPass();
    // A full load: the visitor's cached chats and profile go with the pass.
    globalThis.location.assign('/login');
  };
  return (
    <>
      <IconButton
        aria-label={t('Menu')}
        aria-haspopup="menu"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ color }}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={close}>
        <MenuItem
          onClick={() => {
            close();
            setGuide(true);
          }}
        >
          <ListItemIcon>
            <HelpIcon fontSize="small" />
          </ListItemIcon>
          {t('How this demo works')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            setAbout(true);
          }}
        >
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          {t('About this demo')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            close();
            toggle();
          }}
        >
          <ListItemIcon>
            <ContrastIcon fontSize="small" />
          </ListItemIcon>
          {mode === 'dark' ? t('Light theme') : t('Dark theme')}
        </MenuItem>
        {isAdmin ? (
          <MenuItem
            onClick={() => {
              close();
              navigate('/admin');
            }}
          >
            <ListItemIcon>
              <InsightsIcon fontSize="small" />
            </ListItemIcon>
            {t('Demo admin')}
          </MenuItem>
        ) : null}
        {user ? (
          <MenuItem component="a" href={HUB_URL}>
            <ListItemIcon>
              <AppsIcon fontSize="small" />
            </ListItemIcon>
            {t('Back to portal')}
          </MenuItem>
        ) : null}
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          {t('Sign out')}
        </MenuItem>
      </Menu>
      <AboutDialog open={about} onClose={() => setAbout(false)} />
      <GuideDialog open={guide} onClose={closeGuide} />
    </>
  );
}
