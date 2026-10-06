import { useT } from '@exyconn/i18n';
import { Flex, MenuItem, TextField } from '@exyconn/shell/components/ui';
import { CmsDocumentStatus, CmsPageKind } from '@exyconn/shell/graphql/generated';
import type { PageFilters } from './useCmsPagesFetcher';

/** Shows the "any" option's text when nothing is filtered, with the label above it. */
const EMPTY_SHOWN = { inputLabel: { shrink: true }, select: { displayEmpty: true } };

interface PagesToolbarProps {
  filters: PageFilters;
  onChange: (filters: PageFilters) => void;
}

const STATUSES: Array<{ value: CmsDocumentStatus; label: string }> = [
  { value: CmsDocumentStatus.Draft, label: 'Draft' },
  { value: CmsDocumentStatus.Published, label: 'Published' },
  { value: CmsDocumentStatus.Changed, label: 'Changed' },
];
const KINDS: Array<{ value: CmsPageKind; label: string }> = [
  { value: CmsPageKind.Page, label: 'Pages' },
  { value: CmsPageKind.Template, label: 'Templates' },
];

/** Status and kind filters above the pages grid. */
export function PagesToolbar({ filters, onChange }: Readonly<PagesToolbarProps>) {
  const t = useT();
  return (
    <Flex gap={1.5} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
      <TextField
        select
        size="small"
        slotProps={EMPTY_SHOWN}
        label={t('Status')}
        value={filters.status}
        onChange={(event) =>
          onChange({ ...filters, status: event.target.value as PageFilters['status'] })
        }
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">{t('Any status')}</MenuItem>
        {STATUSES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {t(option.label)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size="small"
        slotProps={EMPTY_SHOWN}
        label={t('Kind')}
        value={filters.kind}
        onChange={(event) =>
          onChange({ ...filters, kind: event.target.value as PageFilters['kind'] })
        }
        sx={{ minWidth: 160 }}
      >
        <MenuItem value="">{t('Pages and templates')}</MenuItem>
        {KINDS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {t(option.label)}
          </MenuItem>
        ))}
      </TextField>
    </Flex>
  );
}
