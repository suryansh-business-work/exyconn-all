import { useFormatters, useT } from '@exyconn/i18n';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from '@exyconn/shell/components/ui';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import type { ReleaseRow } from '../forms/release-status';

/** Every status a release has been through: who moved it, when, and why. */
export function ReleaseHistoryDialog({
  release,
  onClose,
}: Readonly<{ release: ReleaseRow | null; onClose: () => void }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  return (
    <Dialog open={release !== null} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {t('Version {version} history', { version: release?.version ?? '' })}
      </DialogTitle>
      <DialogContent>
        <List dense>
          {release?.statusHistory.map((event) => (
            <ListItem key={`${event.at}-${event.status}`} disableGutters>
              <ListItemText
                primary={<StatusChip value={event.status} />}
                secondary={t('{name} · {when} — {note}', {
                  name: event.byName,
                  when: formatDateTime(event.at),
                  note: event.note,
                })}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
