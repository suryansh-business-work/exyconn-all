import { useState } from 'react';
import UploadIcon from '@mui/icons-material/Upload';
import { useT } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import type { CrmObject } from '@exyconn/shell/graphql/generated';
import { ImportDialog } from './ImportDialog';

interface ImportRecordsButtonProps {
  object: CrmObject;
  /** Runs after every batch the server accepted, so the list behind can refetch. */
  onImported: () => void;
}

/** "Import": opens the CSV import wizard for a record type. */
export function ImportRecordsButton({ object, onImported }: Readonly<ImportRecordsButtonProps>) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="small" startIcon={<UploadIcon />} onClick={() => setOpen(true)}>
        {t('Import')}
      </Button>
      {open && (
        <ImportDialog object={object} onImported={onImported} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
