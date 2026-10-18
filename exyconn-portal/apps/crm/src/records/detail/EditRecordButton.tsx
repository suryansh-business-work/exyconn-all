import { useState, type ReactNode } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import { useT } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';

/** What the record's edit form is handed: close without saving, or close after a save. */
export interface EditFormHandlers {
  onCancel: () => void;
  onDone: () => void;
}

interface EditRecordButtonProps {
  /** The button's full name for screen readers and the dialog title, e.g. "Edit company". */
  label: string;
  /** The record's own edit form. */
  renderForm: (handlers: EditFormHandlers) => ReactNode;
  /** Called after a save, so the page reloads the record. */
  onSaved: () => void;
}

/** "Edit" in a record's profile header, opening the record's form in a dialog. */
export function EditRecordButton({ label, renderForm, onSaved }: Readonly<EditRecordButtonProps>) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const done = () => {
    close();
    onSaved();
  };
  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<EditIcon />}
        aria-label={t(label)}
        onClick={() => setOpen(true)}
        sx={{ flexShrink: 0, alignSelf: 'flex-start' }}
      >
        {t('Edit')}
      </Button>
      <CrudDialog open={open} title={t(label)} onClose={close}>
        {open && renderForm({ onCancel: close, onDone: done })}
      </CrudDialog>
    </>
  );
}
