import type { ReactElement } from 'react';
import { useState } from 'react';
import { Button, Snackbar, Stack, Typography } from '@exyconn/ui';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import { useT } from '@exyconn/i18n';
import { useAnnounce } from '../a11y/LiveAnnouncer';

interface Props {
  /** The month's bounds in the employee's zone, as the report is asked for. */
  fromISO: string;
  toISO: string;
  monthLabel: string;
  disabled: boolean;
}

/**
 * Saves the month's hours report as an Excel workbook: per day the expected and logged hours,
 * the deficit, activity, screenshots, clicks, keystrokes and a remark. The portal builds the
 * file, so it is the same one the employee's manager downloads.
 */
export default function HoursReportButton({
  fromISO,
  toISO,
  monthLabel,
  disabled,
}: Readonly<Props>): ReactElement {
  const t = useT();
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  useAnnounce(notice);

  const save = (): void => {
    setSaving(true);
    globalThis.tracker
      .saveHoursReport(fromISO, toISO)
      .then((result) => {
        if (result.path !== null) {
          setNotice(t('Saved to {path}', { path: result.path }));
        }
      })
      .catch((cause: unknown) => {
        console.error('Saving the hours report failed', cause);
        setNotice(t('Could not save the hours report. Check your connection and try again.'));
      })
      .finally(() => setSaving(false));
  };

  return (
    <Stack spacing={0.75}>
      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        startIcon={<DownloadRounded />}
        loading={saving}
        disabled={disabled}
        onClick={save}
      >
        {t('Download {month} hours report (XLSX)', { month: monthLabel })}
      </Button>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {t(
          'Expected and logged hours, deficit, activity, screenshots, clicks and keystrokes per day.',
        )}
      </Typography>
      <Snackbar
        open={notice !== ''}
        autoHideDuration={6000}
        message={notice}
        onClose={() => setNotice('')}
      />
    </Stack>
  );
}
