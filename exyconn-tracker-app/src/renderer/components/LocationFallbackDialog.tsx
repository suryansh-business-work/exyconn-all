import type { ReactElement } from 'react';
import { useId } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TRACKER_RADIUS,
  Typography,
} from '@exyconn/ui';
import { useT } from '@exyconn/i18n';
import HomeWorkOutlined from '@mui/icons-material/HomeWorkOutlined';
import LocationOffOutlined from '@mui/icons-material/LocationOffOutlined';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import {
  locationFailureDetail,
  locationFailureText,
  type AttendanceLocationFallback,
} from '@exyconn/tracker-core';
import OpenLocationSettingsButton from './OpenLocationSettingsButton';

interface Props {
  /** The location error's message; null keeps the dialog closed. */
  failure: string | null;
  /** The address on the employee's record; null when HR has not added one. */
  profileAddress: string | null;
  /** Which fallback is being sent, for its spinner; null when none is. */
  marking: AttendanceLocationFallback | null;
  /** Why the last mark failed, already in words; null when it has not. */
  error: string | null;
  onRetry: () => void;
  onFallback: (fallback: AttendanceLocationFallback) => void;
  onClose: () => void;
}

/**
 * Shown when no location could be read for attendance. Says why — in a sentence and in the
 * platform's own words, for whoever helps them — and never leaves the employee stuck: they can
 * try again, fix the setting, mark in at the address on their employee record, or mark in
 * without a location. Either fallback is recorded as such, and audited, on the portal.
 */
export default function LocationFallbackDialog({
  failure,
  profileAddress,
  marking,
  error,
  onRetry,
  onFallback,
  onClose,
}: Readonly<Props>): ReactElement {
  const t = useT();
  const titleId = useId();
  const busy = marking !== null;
  const detail = failure === null ? '' : locationFailureDetail(failure);

  return (
    <Dialog
      open={failure !== null}
      onClose={busy ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>{t('Your location could not be read')}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
            {failure === null ? null : locationFailureText(failure, t)}
          </Alert>
          {detail === '' ? null : (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('Details: {detail}', { detail })}
            </Typography>
          )}
          <DialogContentText>
            {t('You can still mark your attendance without a device location.')}
          </DialogContentText>
          <Stack spacing={0.5}>
            <Button
              variant="outlined"
              startIcon={<HomeWorkOutlined />}
              loading={marking === 'PROFILE_ADDRESS'}
              disabled={busy || profileAddress === null}
              onClick={() => onFallback('PROFILE_ADDRESS')}
            >
              {t('Mark in at my profile address')}
            </Button>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {profileAddress ??
                t('There is no address on your employee record. Ask HR to add one.')}
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<LocationOffOutlined />}
              loading={marking === 'NONE'}
              disabled={busy}
              onClick={() => onFallback('NONE')}
            >
              {t('Mark in without location')}
            </Button>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('HR will see that this attendance was marked without a location.')}
            </Typography>
          </Stack>
          {error === null ? null : (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        <OpenLocationSettingsButton size="small" color="inherit" />
        <Button color="inherit" onClick={onClose} disabled={busy}>
          {t('Cancel')}
        </Button>
        <Button
          variant="contained"
          startIcon={<RefreshRounded />}
          disabled={busy}
          onClick={onRetry}
        >
          {t('Try again')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
