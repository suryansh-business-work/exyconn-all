import { useState } from 'react';
import { YStack } from 'tamagui';
import { buildReportCsv, type ReportDay } from '@exyconn/tracker-core';
import { AppButton } from '../ui/AppButton';
import { Notice } from '../ui/Notice';
import { Caption } from '../ui/Typography';
import { shareReport } from './share-report';

interface Props {
  days: readonly ReportDay[];
  /** "2026-02" — the month the file is named after. */
  monthKey: string;
  monthLabel: string;
}

interface Problem {
  severity: 'warning' | 'error';
  message: string;
  detail: string;
}

const UNAVAILABLE: Problem = {
  severity: 'warning',
  message: 'This phone cannot open a share sheet, so the report cannot leave the app from here.',
  detail: 'Every figure the file would hold is on this screen.',
};

const FAILED: Problem = {
  severity: 'error',
  message: 'Could not prepare the report.',
  detail: 'Check that your phone has free storage, then try again.',
};

/**
 * Takes the month away as a spreadsheet, through the phone's share sheet.
 *
 * Disabled on an empty month rather than writing a file with only a header in it: a report of
 * nothing is not a report, and a button that always "works" teaches people to trust a file
 * they have not opened.
 *
 * Closing the share sheet is a normal outcome and says nothing; a real failure says so,
 * because a download the employee believes happened and did not is worse than an error.
 */
export function ReportDownloadButton({ days, monthKey, monthLabel }: Readonly<Props>) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  const share = (): void => {
    setBusy(true);
    setProblem(null);
    shareReport(buildReportCsv(days, monthKey), `Report for ${monthLabel}`)
      .then((outcome) => {
        if (outcome === 'unavailable') {
          setProblem(UNAVAILABLE);
        }
      })
      .catch((cause: unknown) => {
        console.error('Sharing the report failed', cause);
        setProblem(FAILED);
      })
      .finally(() => setBusy(false));
  };

  return (
    <YStack gap="$2">
      <AppButton
        label={`Download ${monthLabel} as CSV`}
        tone="outlined"
        icon="download"
        full
        busy={busy}
        disabled={days.length === 0}
        onPress={share}
      />
      <Caption>
        Your own tracked days, as a spreadsheet — one row per day, with the month’s totals.
      </Caption>
      {problem === null ? null : (
        <Notice severity={problem.severity} detail={problem.detail}>
          {problem.message}
        </Notice>
      )}
    </YStack>
  );
}
