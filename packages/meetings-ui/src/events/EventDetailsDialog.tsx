import { useFormatters, useT } from '@exyconn/i18n';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { MeetingEvent } from './events-grid';

/** The details JSON indented for reading; anything that is not JSON is shown as it came. */
export function prettyDetails(details: string): string {
  if (!details.trim()) {
    return '';
  }
  try {
    return JSON.stringify(JSON.parse(details), null, 2);
  } catch {
    return details;
  }
}

/** One log entry in full, its details pretty-printed. */
export function EventDetailsDialog({
  event,
  onClose,
}: Readonly<{ event: MeetingEvent | null; onClose: () => void }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const details = event ? prettyDetails(event.details) : '';
  return (
    <Dialog open={event !== null} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('Log entry')}</DialogTitle>
      <DialogContent>
        {event && (
          <>
            <DetailFactGrid>
              <DetailFact label="Time">{formatDateTime(event.createdAt)}</DetailFact>
              <DetailFact label="Level">
                <StatusChip value={event.level} />
              </DetailFact>
              <DetailFact label="Type">{event.type}</DetailFact>
              <DetailFact label="Actor">{event.actorName}</DetailFact>
              <DetailFact label="Meeting">{event.meetingTitle || '—'}</DetailFact>
            </DetailFactGrid>
            <Box component="p">{event.message}</Box>
            {details && (
              <Box
                component="pre"
                aria-label={t('Details')}
                sx={{
                  bgcolor: 'background.muted',
                  p: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: 'caption.fontSize',
                }}
              >
                {details}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
