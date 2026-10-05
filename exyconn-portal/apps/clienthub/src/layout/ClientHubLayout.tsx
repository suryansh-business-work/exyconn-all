import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApolloClient } from '@apollo/client/react';
import { useT } from '@exyconn/i18n';
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  Text,
  Toolbar,
  Tooltip,
} from '@exyconn/shell/components/ui';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import PaymentsIcon from '@mui/icons-material/Payments';
import SupportIcon from '@mui/icons-material/SupportAgent';
import FolderIcon from '@mui/icons-material/FolderOpen';
import { useClientHubMeQuery } from '@exyconn/shell/graphql/generated';
import { clientPass } from '../auth/clientPass';
import { PATHS } from '../paths';

const NAV = [
  { to: PATHS.dashboard, label: 'Overview', icon: <DashboardIcon fontSize="small" /> },
  { to: PATHS.invoices, label: 'Invoices', icon: <ReceiptIcon fontSize="small" /> },
  { to: PATHS.transactions, label: 'Transactions', icon: <PaymentsIcon fontSize="small" /> },
  { to: PATHS.support, label: 'Support', icon: <SupportIcon fontSize="small" /> },
  { to: PATHS.projects, label: 'Projects', icon: <FolderIcon fontSize="small" /> },
] as const;

/**
 * The client hub's frame: who is signed in and for which company, the five sections, and a
 * way out. Built for a client, not an employee — no sidebar of modules, no portal switcher.
 */
export function ClientHubLayout() {
  const t = useT();
  const navigate = useNavigate();
  const apollo = useApolloClient();
  const { data } = useClientHubMeQuery({ fetchPolicy: 'cache-first' });
  const me = data?.clientHubMe;

  const signOut = () => {
    clientPass.clear();
    apollo
      .clearStore()
      .catch((error: unknown) => console.error('Could not clear the cache', error))
      .finally(() => navigate('/login', { replace: true }));
  };

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
            <Text size="caption" color="text.secondary">
              {t('Client Hub')}
            </Text>
            <Text weight="semibold" noWrap>
              {me?.company || me?.clientName || ''}
            </Text>
          </Stack>
          <Text size="sm" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {me?.name}
          </Text>
          <Tooltip title={t('Sign out')}>
            <IconButton aria-label={t('Sign out')} onClick={signOut}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
        <Box
          component="nav"
          aria-label={t('Client hub sections')}
          sx={{ display: 'flex', gap: 0.5, px: 2, pb: 1, overflowX: 'auto' }}
        >
          {NAV.map((item) => (
            <Button
              key={item.to}
              component={NavLink}
              to={item.to}
              startIcon={item.icon}
              size="small"
              color="inherit"
              sx={{
                flexShrink: 0,
                '&.active': { bgcolor: 'action.selected', fontWeight: 'fontWeightBold' },
              }}
            >
              {t(item.label)}
            </Button>
          ))}
        </Box>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
