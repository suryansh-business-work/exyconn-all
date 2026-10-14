import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Avatar,
  Box,
  Button,
  Stack,
  Typography,
  borderWidth,
  fontWeight,
} from '@exyconn/shell/components/ui';
import type { AuthUser } from '@exyconn/shell/auth/AuthContext';
import { PAGE_GUTTER } from '@exyconn/shell/layout/PortalLayout/metrics';
import { DEMO_PATH } from '../admin.paths';

/** The initials an avatar shows when the person has no photo. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/**
 * The admin area's compact top bar, in the portal's own look rather than the WhatsApp skin:
 * the way back to the demo, the area's title, and who is signed in.
 */
export function AdminTopBar({ user }: Readonly<{ user: AuthUser }>) {
  const t = useT();
  const navigate = useNavigate();

  return (
    <Box
      component="header"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: `${borderWidth.hairline}px solid`,
        borderColor: 'divider',
        px: PAGE_GUTTER,
        py: 1,
      }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Button
          size="small"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(DEMO_PATH)}
          aria-label={t('Back to the demo')}
          sx={{ flexShrink: 0 }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {t('Demo')}
          </Box>
        </Button>
        <Typography
          variant="h6"
          component="h1"
          noWrap
          sx={{ flex: 1, minWidth: 0, fontWeight: fontWeight.semibold }}
        >
          {t('WhatsApp demo admin')}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Avatar src={user.avatarUrl ?? undefined} alt={user.name} sx={{ width: 32, height: 32 }}>
            {initials(user.name)}
          </Avatar>
          <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: fontWeight.medium }}>
              {user.name}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
              {user.email}
            </Typography>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
