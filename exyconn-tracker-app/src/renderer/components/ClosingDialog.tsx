import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dialog,
  DialogContent,
  LinearProgress,
  Stack,
  TRACKER_RADIUS,
  Typography,
} from '@exyconn/ui';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import { formatCount } from '@exyconn/tracker-core';
import { useT } from '@exyconn/i18n';

/**
 * Shown when the employee closes the app while an upload is still going up.
 *
 * There is no "close anyway" button on purpose. Quitting mid-upload does not lose the work —
 * the outbox is durable — but it does make it climb again, and a sign-out flush that never
 * finished strands the session's last bucket. The upload is seconds away; the app waits for
 * it and quits on its own, and this says so rather than appearing to have ignored the click.
 */
export default function ClosingDialog(): ReactElement | null {
  const t = useT();
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => window.tracker.onCloseBlocked((count) => setPending(count)), []);
  useEffect(() => window.tracker.onCloseReleased(() => setPending(null)), []);

  if (pending === null) {
    return null;
  }

  const what =
    pending > 0
      ? t('{count} still to upload', { count: formatCount(pending) })
      : t('Finishing the upload');

  return (
    <Dialog open maxWidth="xs" fullWidth aria-label={t('Upload in progress')}>
      <DialogContent>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={1.25}
            sx={{
              alignItems: 'center',
            }}
          >
            <CloudUploadOutlined fontSize="small" sx={{ color: 'warning.main' }} />
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
              {t('Upload in progress')}
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
            }}
          >
            {t(
              '{what}. Closing now would make this work upload all over again — the tracker will close by itself the moment it lands.',
              { what },
            )}
          </Typography>

          <LinearProgress aria-label={what} />

          <Alert severity="info" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
            {t(
              'Nothing is lost either way: your work is saved on this machine until it is uploaded.',
            )}
          </Alert>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
