import type { ReactElement } from 'react';
import { useState } from 'react';
import { Button, Snackbar, Stack, Typography } from '@exyconn/ui';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import type { ReportDay } from '@shared/types';
import { buildReportCsv } from '../report-csv';

interface Props {
  days: readonly ReportDay[];
  /** "2026-02" — the month the file is named after. */
  monthKey: string;
  monthLabel: string;
}

/**
 * Takes the month away as a spreadsheet.
 *
 * Disabled on an empty month rather than writing a file with only a header in it: a report of
 * nothing is not a report, and a button that always "works" teaches people to trust a file
 * they have not opened.
 *
 * A cancelled save dialog is a normal outcome and says nothing; a real failure says so,
 * because a download the employee believes happened and did not is worse than an error.
 */
export default function ReportDownloadButton({
  days,
  monthKey,
  monthLabel,
}: Readonly<Props>): ReactElement {
  const [notice, setNotice] = useState('');

  const save = (): void => {
    window.tracker
      .saveReport(buildReportCsv(days, monthKey))
      .then((result) => {
        if (result.path !== null) {
          setNotice(`Saved to ${result.path}`);
        }
      })
      .catch((cause: unknown) => {
        console.error('Saving the report failed', cause);
        setNotice('Could not save the report. Check the folder and try again.');
      });
  };

  return (
    <Stack spacing={0.75}>
      <Button
        variant="outlined"
        color="inherit"
        fullWidth
        startIcon={<DownloadRounded />}
        disabled={days.length === 0}
        onClick={save}
      >
        Download {monthLabel} as CSV
      </Button>
      <Typography variant="caption" color="text.secondary">
        Your own tracked days, as a spreadsheet — one row per day, with the month’s totals.
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
