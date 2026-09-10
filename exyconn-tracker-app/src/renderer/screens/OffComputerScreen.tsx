import type { ReactElement } from 'react';
import { useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Flex,
  LocalizationProvider,
  AdapterDateFns,
  Stack,
  Typography,
} from '@exyconn/ui';
import type { ManualEntry, TrackerProject } from '@shared/types';
import ManualEntryForm from '../components/ManualEntryForm';
import ManualEntryList from '../components/ManualEntryList';
import Surface from '../components/Surface';
import useManualEntries from '../hooks/useManualEntries';

interface Props {
  projects: TrackerProject[];
  /** The employee's chosen zone — every window below is read in it. */
  timezone: string;
}

/**
 * Work done away from the computer: a client meeting, a site visit, a call from the car.
 *
 * It used to be claimable only from the portal, which meant opening a browser to record time
 * the app was sitting right there for. Claiming and taking one back both happen here now; the
 * decision still belongs to a manager, in the portal's review queue.
 */
export default function OffComputerScreen({ projects, timezone }: Readonly<Props>): ReactElement {
  const { entries, loading, error, reload } = useManualEntries();
  const [claiming, setClaiming] = useState(false);

  function withdraw(entry: ManualEntry): void {
    window.tracker
      .withdrawManualEntry(entry.id)
      .then(reload)
      .catch((cause: unknown) => console.error('Withdrawing the claim failed', cause));
  }

  function filed(): void {
    setClaiming(false);
    reload();
  }

  if (claiming) {
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Stack spacing={2}>
          <Typography variant="h6">Claim off-computer time</Typography>
          <Surface>
            <ManualEntryForm
              projects={projects}
              onCancel={() => setClaiming(false)}
              onDone={filed}
            />
          </Surface>
        </Stack>
      </LocalizationProvider>
    );
  }

  return (
    <Stack spacing={2}>
      <Flex direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Stack spacing={0.25}>
          <Typography variant="h6">Off-computer time</Typography>
          <Typography variant="caption" sx={{
            color: "text.secondary"
          }}>
            Hours the tracker could not measure, and where each one stands.
          </Typography>
        </Stack>
        <Button variant="contained" size="small" onClick={() => setClaiming(true)}>
          Claim time
        </Button>
      </Flex>

      {error !== null && <Alert severity="error">{error}</Alert>}

      {loading ? (
        <Flex direction="row" justifyContent="center">
          <CircularProgress size={24} />
        </Flex>
      ) : (
        <ManualEntryList entries={entries} timezone={timezone} onWithdraw={withdraw} />
      )}
    </Stack>
  );
}
