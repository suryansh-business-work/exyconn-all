import { useT } from '@exyconn/i18n';
import { Box, Chip, Flex } from '@exyconn/shell/components/ui';
import type { Column } from '@exyconn/shell/components/data/DataTable';
import { PROPERTY_TYPE_LABELS } from './property-types';
import type { PropertyTableRow } from './property-rows';

function LabelCell({ row }: Readonly<{ row: PropertyTableRow }>) {
  const t = useT();
  return (
    <Flex direction="row" spacing={1} alignItems="center">
      <span>{row.label}</span>
      {row.property === null && <Chip size="small" variant="outlined" label={t('Built-in')} />}
    </Flex>
  );
}

function TypeCell({ row }: Readonly<{ row: PropertyTableRow }>) {
  const t = useT();
  return <>{t(PROPERTY_TYPE_LABELS[row.type])}</>;
}

function RequiredCell({ row }: Readonly<{ row: PropertyTableRow }>) {
  const t = useT();
  return <>{row.required ? t('Yes') : t('No')}</>;
}

/** The properties table's columns. Labels and help text are the company's own words. */
export const PROPERTY_COLUMNS: Column<PropertyTableRow>[] = [
  { key: 'label', label: 'Label', render: (row) => <LabelCell row={row} /> },
  {
    key: 'key',
    label: 'Key',
    render: (row) => <Box component="code">{row.key}</Box>,
  },
  { key: 'type', label: 'Type', render: (row) => <TypeCell row={row} /> },
  { key: 'required', label: 'Required', render: (row) => <RequiredCell row={row} /> },
  { key: 'choices', label: 'Choices', render: (row) => row.choices ?? '' },
  { key: 'description', label: 'Help text', render: (row) => row.description },
];
