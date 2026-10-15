import { useState } from 'react';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { useT } from '@exyconn/i18n';
import { Button } from '@exyconn/shell/components/ui';
import type { ColumnChoice } from './buildColumns';
import { ColumnsDialog } from './ColumnsDialog';

interface ColumnsButtonProps {
  choices: readonly ColumnChoice[];
  visible: readonly string[];
  defaults: readonly string[];
  onApply: (columns: string[]) => void;
}

/** "Columns": opens the dialog that picks and orders the list's columns. */
export function ColumnsButton({
  choices,
  visible,
  defaults,
  onApply,
}: Readonly<ColumnsButtonProps>) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        size="small"
        startIcon={<ViewColumnIcon />}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {t('Columns')}
      </Button>
      {open && (
        <ColumnsDialog
          open
          choices={choices}
          visible={visible}
          defaults={defaults}
          onClose={() => setOpen(false)}
          onApply={onApply}
        />
      )}
    </>
  );
}
