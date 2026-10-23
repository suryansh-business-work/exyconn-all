import { useState } from 'react';
import NearMeIcon from '@mui/icons-material/NearMe';
import { useT } from '@exyconn/i18n';
import { Button, Dialog, DialogTitle } from '@exyconn/shell/components/ui';
import { NearFilterForm } from './near-filter.form';
import type { NearFilter } from './near-filter.types';

interface NearFilterButtonProps {
  near: NearFilter | null;
  /** The new filter, or null to take it off. */
  onApply: (near: NearFilter | null) => void;
}

const TITLE_ID = 'record-near-title';

/** "Near a location": opens the centre-and-radius form; highlighted while a circle is applied. */
export function NearFilterButton({ near, onApply }: Readonly<NearFilterButtonProps>) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const apply = (next: NearFilter | null) => {
    onApply(next);
    close();
  };
  return (
    <>
      <Button
        size="small"
        startIcon={<NearMeIcon />}
        variant={near ? 'contained' : 'text'}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {t('Near a location')}
      </Button>
      <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby={TITLE_ID}>
        <DialogTitle id={TITLE_ID}>{t('Near a location')}</DialogTitle>
        {open && (
          <NearFilterForm
            near={near}
            onApply={apply}
            onClear={() => apply(null)}
            onCancel={close}
          />
        )}
      </Dialog>
    </>
  );
}
