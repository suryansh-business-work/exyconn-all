import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useT } from '@exyconn/i18n';
import { Badge, Button, Drawer, Flex, IconButton, Typography } from '@exyconn/shell/components/ui';
import { conditionCount, type FilterGroup } from '../list/recordQuery';
import type { CrmPropertyInfo } from '../schema';
import { FilterBuilderForm } from './filter-builder';

interface FiltersButtonProps {
  properties: readonly CrmPropertyInfo[];
  groups: readonly FilterGroup[];
  onApply: (groups: FilterGroup[]) => void;
}

const TITLE_ID = 'record-filters-title';

/** "Filters" with a count of the active conditions; opens the builder in a side panel. */
export function FiltersButton({ properties, groups, onApply }: Readonly<FiltersButtonProps>) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const count = conditionCount(groups);
  const close = () => setOpen(false);
  const apply = (next: FilterGroup[]) => {
    onApply(next);
    close();
  };

  return (
    <>
      <Badge badgeContent={count} color="primary" overlap="rectangular">
        <Button
          size="small"
          startIcon={<FilterListIcon />}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label={t('Filters ({count} active)', { count })}
        >
          {t('Filters')}
        </Button>
      </Badge>
      <Drawer
        anchor="right"
        open={open}
        onClose={close}
        slotProps={{
          paper: {
            'aria-labelledby': TITLE_ID,
            sx: { width: { xs: '100%', sm: 560 }, maxWidth: '100%' },
          },
        }}
      >
        <Flex
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ px: 2, py: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Typography variant="h6" component="h2" id={TITLE_ID}>
            {t('Filters')}
          </Typography>
          <IconButton onClick={close} aria-label={t('Close')} edge="end">
            <CloseIcon />
          </IconButton>
        </Flex>
        {open && (
          <FilterBuilderForm
            properties={properties}
            groups={groups}
            onApply={apply}
            onCancel={close}
          />
        )}
      </Drawer>
    </>
  );
}
