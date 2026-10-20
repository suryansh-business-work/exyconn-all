import { useT } from '@exyconn/i18n';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { SuppressionDetails } from './SuppressionDetails';
import { SuppressionNoteForm } from './forms/suppression-note';
import { RemoveSuppressionForm } from './forms/remove-suppression';
import { BulkSuppressionForm } from './forms/bulk-suppression';
import type { PagedSuppressionRow } from './suppression-grid';

/** Which dialog is open, and for which row. */
export type SuppressionDialog =
  | { kind: 'details'; row: PagedSuppressionRow }
  | { kind: 'note'; row: PagedSuppressionRow }
  | { kind: 'remove'; row: PagedSuppressionRow }
  | { kind: 'bulk' }
  | null;

interface SuppressionDialogsProps {
  dialog: SuppressionDialog;
  onClose: () => void;
  /** Closes and re-reads the list and its figures. */
  onChanged: () => void;
}

const TITLES: Readonly<Record<NonNullable<SuppressionDialog>['kind'], string>> = {
  details: 'Suppression details',
  note: 'Edit note',
  remove: 'Remove suppression',
  bulk: 'Suppress several addresses',
};

/** The page's dialogs: details, note, removal and bulk add. */
export function SuppressionDialogs({
  dialog,
  onClose,
  onChanged,
}: Readonly<SuppressionDialogsProps>) {
  const t = useT();
  return (
    <CrudDialog
      open={Boolean(dialog)}
      title={dialog ? t(TITLES[dialog.kind]) : ''}
      onClose={onClose}
    >
      {dialog?.kind === 'details' && <SuppressionDetails row={dialog.row} />}
      {dialog?.kind === 'note' && (
        <SuppressionNoteForm
          id={dialog.row.id}
          note={dialog.row.note}
          onDone={onChanged}
          onCancel={onClose}
        />
      )}
      {dialog?.kind === 'remove' && (
        <RemoveSuppressionForm
          id={dialog.row.id}
          email={dialog.row.email}
          reason={dialog.row.reason}
          onDone={onChanged}
          onCancel={onClose}
        />
      )}
      {dialog?.kind === 'bulk' && <BulkSuppressionForm onDone={onChanged} onCancel={onClose} />}
    </CrudDialog>
  );
}
