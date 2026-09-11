import { useEffect, useState } from 'react';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Flex,
  Text,
} from '@exyconn/shell/components/ui';
import { AppLogStatus, useListAppLogEventsQuery } from '@exyconn/shell/graphql/generated';
import type { AppLogRow } from '../logs-grid';
import type { LogActions } from '../useLogActions';
import { CodeBlock } from './CodeBlock';
import { LogSummary } from './LogSummary';
import { OccurrencesTable } from './OccurrencesTable';
import { OccurrenceDetail } from './OccurrenceDetail';

interface Props {
  row: AppLogRow | null;
  actions: LogActions;
  onClose: () => void;
}

interface StatusButtonsProps {
  row: AppLogRow;
  onStatus: (status: AppLogStatus) => void;
}

/** Open problems can be resolved or ignored; anything else can only be re-opened. */
function StatusButtons({ row, onStatus }: Readonly<StatusButtonsProps>) {
  if (row.status !== AppLogStatus.Open) {
    return <Button onClick={() => onStatus(AppLogStatus.Open)}>Re-open</Button>;
  }
  return (
    <>
      <Button onClick={() => onStatus(AppLogStatus.Ignored)}>Ignore</Button>
      <Button color="success" onClick={() => onStatus(AppLogStatus.Resolved)}>
        Mark resolved
      </Button>
    </>
  );
}

/**
 * One problem in full: its numbers, its recent occurrences (who, when, which device and build)
 * and, for the picked occurrence, the stack and the breadcrumbs that led to it.
 */
export function LogDetailDialog({ row, actions, onClose }: Readonly<Props>) {
  const { data, loading, error } = useListAppLogEventsQuery({
    variables: { groupId: row?.id ?? '' },
    skip: !row,
    fetchPolicy: 'network-only',
  });
  const events = data?.listAppLogEvents ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // A newly opened problem starts on its most recent occurrence.
  const latestId = events[0]?.id ?? null;
  useEffect(() => {
    setSelectedId(latestId);
  }, [latestId]);

  const selected = events.find((event) => event.id === selectedId);
  const title = row?.errorName ? `${row.errorName}: ${row.message}` : (row?.message ?? '');

  /** Closes once the action went through; a cancelled or failed one leaves the dialog open. */
  const closeAfter = (action: Promise<boolean>) => {
    action
      .then((done) => {
        if (done) {
          onClose();
        }
      })
      .catch((err: unknown) => console.error('Log action failed', err));
  };

  return (
    <Dialog open={row !== null} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ wordBreak: 'break-word' }}>{title}</DialogTitle>
      <DialogContent dividers>
        {row && (
          <Flex direction="column" spacing={2.5}>
            <LogSummary row={row} />
            {error && <Alert severity="error">{error.message}</Alert>}
            {loading && events.length === 0 && <CircularProgress size={24} />}
            {!loading && events.length === 0 && (
              <CodeBlock title="Stack (latest)" text={row.stack} />
            )}
            {events.length > 0 && (
              <>
                <Text size="sm" weight="semibold">
                  Recent occurrences
                </Text>
                <OccurrencesTable
                  events={events}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </>
            )}
            {selected && <OccurrenceDetail event={selected} />}
          </Flex>
        )}
      </DialogContent>
      {row && (
        <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Button color="error" onClick={() => closeAfter(actions.remove(row))}>
            Delete
          </Button>
          <StatusButtons
            row={row}
            onStatus={(status) => closeAfter(actions.changeStatus(row, status))}
          />
          <Button
            variant="contained"
            startIcon={<SmartToyIcon />}
            disabled={actions.copying}
            onClick={() => {
              actions.copyFixPrompt(row).catch((err: unknown) => console.error(err));
            }}
          >
            Copy fix prompt for Claude
          </Button>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
