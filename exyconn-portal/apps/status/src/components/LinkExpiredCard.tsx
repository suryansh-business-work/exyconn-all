import { useT } from '@exyconn/i18n';
import { Card, Typography, iconSize, fontWeight } from '@exyconn/shell/components/ui';
import LockPersonIcon from '@mui/icons-material/LockPerson';

/**
 * What a dead share link shows. Unknown, expired, revoked or made private again all read
 * the same, so the page tells a visitor nothing about which links once existed.
 */
export function LinkExpiredCard() {
  const t = useT();
  return (
    <Card variant="outlined" sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
      <LockPersonIcon color="disabled" sx={{ fontSize: iconSize['5xl'] }} />
      <Typography
        variant="h5"
        sx={{
          fontWeight: fontWeight.bold,
          mt: 1,
        }}
      >
        {t('This link no longer works')}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          mt: 1,
        }}
      >
        {t('It has expired, been revoked, or was never valid. Ask whoever sent it for a new one.')}
      </Typography>
    </Card>
  );
}
