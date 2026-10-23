import { useFormatters, useT } from '@exyconn/i18n';
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Flex,
  Stack,
  useMediaQuery,
  useTheme,
} from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import type { CrmTimelineObject } from '@exyconn/shell/graphql/generated';
import { AttachmentPreview } from './AttachmentPreview';
import { KIND_STYLES } from './timeline.kinds';
import type { TimelineRow } from './TimelineEntry';
import { TimelineDetailFields } from './TimelineDetailFields';
import { TimelineTitle } from './TimelineTitle';

const TITLE_ID = 'timeline-details-title';

interface TimelineDetailsDialogProps {
  object: CrmTimelineObject;
  recordId: string;
  /** The entry to show; null keeps the dialog closed. */
  row: TimelineRow | null;
  onClose: () => void;
}

/** What the timeline already knows about the entry: its kind, status, when and who. */
function EntrySummary({ row }: Readonly<{ row: TimelineRow }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  return (
    <Stack spacing={2}>
      <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip size="small" label={t(KIND_STYLES[row.kind].label)} />
        {row.status && <Chip size="small" variant="outlined" label={row.status} />}
      </Flex>
      <DetailFactGrid>
        <DetailFact label="When">
          <time dateTime={row.at}>{formatDateTime(row.at)}</time>
        </DetailFact>
        {row.actor && <DetailFact label="By">{row.actor}</DetailFact>}
        {row.url && (
          <DetailFact label="Page">
            <TimelineTitle row={row} />
          </DetailFact>
        )}
      </DetailFactGrid>
    </Stack>
  );
}

/**
 * One timeline entry in full — a CRM email with its sender, recipients and body; a note, call,
 * meeting or task with every field; a system email's subject, template and status; a deal,
 * lead, form or WhatsApp sign-up. Entries with a page of their own go there instead.
 */
export function TimelineDetailsDialog({
  object,
  recordId,
  row,
  onClose,
}: Readonly<TimelineDetailsDialogProps>) {
  const t = useT();
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Dialog
      open={Boolean(row)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      fullScreen={phone}
      aria-labelledby={TITLE_ID}
    >
      <DialogTitle id={TITLE_ID} sx={{ overflowWrap: 'anywhere' }}>
        {row?.title}
      </DialogTitle>
      <DialogContent dividers>
        {row && (
          <Stack spacing={2}>
            <EntrySummary row={row} />
            <TimelineDetailFields key={row.id} object={object} recordId={recordId} row={row} />
            {row.attachments.map((attachment) => (
              <AttachmentPreview key={attachment.url} attachment={attachment} />
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
