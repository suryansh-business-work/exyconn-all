import { useMemo, useState } from 'react';
import SortIcon from '@mui/icons-material/Sort';
import { useT } from '@exyconn/i18n';
import { Badge, Button, Dialog, DialogTitle } from '@exyconn/shell/components/ui';
import type { CrmSortInput } from '@exyconn/shell/graphql/generated';
import { propertyLabel } from '../../propertyText';
import type { CrmPropertyInfo } from '../../schema';
import { SortForm } from './sort.form';

interface SortButtonProps {
  properties: readonly CrmPropertyInfo[];
  sorts: readonly CrmSortInput[];
  onApply: (sorts: CrmSortInput[]) => void;
}

const TITLE_ID = 'record-sort-title';

/** "Sort": up to three levels, beyond the single column a header click sorts by. */
export function SortButton({ properties, sorts, onApply }: Readonly<SortButtonProps>) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const options = useMemo(
    () =>
      properties.map((property) => ({ value: property.key, label: propertyLabel(t, property) })),
    [properties, t],
  );
  const close = () => setOpen(false);
  const apply = (next: CrmSortInput[]) => {
    onApply(next);
    close();
  };
  return (
    <>
      <Badge badgeContent={sorts.length} color="primary" overlap="rectangular">
        <Button
          size="small"
          startIcon={<SortIcon />}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={t('Sort ({count} levels)', { count: sorts.length })}
        >
          {t('Sort')}
        </Button>
      </Badge>
      <Dialog open={open} onClose={close} fullWidth maxWidth="sm" aria-labelledby={TITLE_ID}>
        <DialogTitle id={TITLE_ID}>{t('Sort')}</DialogTitle>
        {open && <SortForm options={options} sorts={sorts} onApply={apply} onCancel={close} />}
      </Dialog>
    </>
  );
}
