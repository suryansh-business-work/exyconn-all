import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Typography, iconSize } from '@exyconn/shell/components/ui';
import { CenteredState } from '@exyconn/shell/components/feedback/CenteredState';
import { usePageTitle } from '@exyconn/shell/components/layout/usePageTitle';
import { DEMO_PATH } from '../admin.paths';

/**
 * The 403 screen: shown to a signed-in person without the admin role, and whenever the server
 * answers FORBIDDEN (a role revoked mid-session). Says why, and offers the way back.
 */
export function AdminForbidden() {
  const t = useT();
  const navigate = useNavigate();
  const title = t('Admins only');
  usePageTitle(title);

  return (
    <CenteredState fill>
      <Box sx={{ textAlign: 'center', maxWidth: 420, px: 2 }}>
        <Box
          aria-hidden
          sx={{ color: 'text.secondary', mb: 1, '& svg': { fontSize: iconSize['3xl'] } }}
        >
          <LockOutlinedIcon />
        </Box>
        <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          {t(
            'The WhatsApp demo admin area — analytics, session logs and bot workflows — is open to company administrators only. Ask an administrator if you need access.',
          )}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(DEMO_PATH)}
        >
          {t('Back to the demo')}
        </Button>
      </Box>
    </CenteredState>
  );
}
