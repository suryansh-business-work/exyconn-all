import type { ReactElement } from 'react';
import { useId } from 'react';
import {
  Alert,
  Box,
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
import { useFormatters, useT } from '@exyconn/i18n';
import { mapEmbedUrl } from '@exyconn/tracker-core';
import type { TrackerLocationInput } from '@shared/types';

/** The confirm half of the dialog — present only when the dialog is asking, not showing. */
export interface LocationConfirm {
  /** Already translated. */
  label: string;
  busy: boolean;
  /** Why the last confirm failed, already in words; null when it has not. */
  error: string | null;
  onConfirm: () => void;
}

interface Props {
  /** The fix to pin; null keeps the dialog closed. */
  location: TrackerLocationInput | null;
  /** Already translated. */
  title: string;
  /** Already translated; a sentence above the map. */
  description: string;
  onClose: () => void;
  /** Omitted for a view-only pin. */
  confirm?: LocationConfirm;
}

/**
 * One location on an embedded Google map, with how accurate the fix is. Used both to confirm
 * where attendance is being marked from and to look at a pin from earlier in the day.
 */
export default function LocationMapDialog({
  location,
  title,
  description,
  onClose,
  confirm,
}: Readonly<Props>): ReactElement {
  const t = useT();
  const { formatNumber } = useFormatters();
  const titleId = useId();
  const busy = confirm?.busy ?? false;
  const accuracy =
    location === null
      ? ''
      : t('Accuracy about {metres} m', {
          metres: formatNumber(Math.round(location.accuracyM)),
        });

  return (
    <Dialog
      open={location !== null}
      onClose={busy ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          <DialogContentText>{description}</DialogContentText>
          {location === null ? null : (
            <Box
              component="iframe"
              title={t('Map of the location pin')}
              src={mapEmbedUrl(location)}
              loading="lazy"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin"
              sx={{
                width: '100%',
                height: 240,
                border: 0,
                borderRadius: `${TRACKER_RADIUS}px`,
                display: 'block',
              }}
            />
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {accuracy}
          </Typography>
          {confirm?.error ? (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: `${TRACKER_RADIUS}px` }}>
              {confirm.error}
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          {confirm === undefined ? t('Close') : t('Cancel')}
        </Button>
        {confirm === undefined ? null : (
          <Button variant="contained" loading={busy} onClick={confirm.onConfirm}>
            {confirm.label}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
