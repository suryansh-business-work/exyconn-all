import { useT } from '@exyconn/i18n';
import {
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Text,
} from '@exyconn/shell/components/ui';
import type { CrmPropertyInfo } from '../../schema';
import type { CsvFile } from '../csvFile';
import { sampleValues, unmappedRequired, type ColumnMapping } from '../mapping';
import { propertyLabel } from '../../propertyText';
import { PropertySelect } from './PropertySelect';

interface MapStepProps {
  file: CsvFile;
  mapping: ColumnMapping;
  properties: readonly CrmPropertyInfo[];
  onAssign: (column: number, key: string | null) => void;
}

/** Step 2: say which property each column fills. Required properties must all be mapped. */
export function MapStep({ file, mapping, properties, onAssign }: Readonly<MapStepProps>) {
  const t = useT();
  const missing = unmappedRequired(mapping, properties);
  const columns = file.headers.map((header, index) => ({
    id: `${index}:${header}`,
    index,
    header,
    samples: sampleValues(file.rows, index),
  }));
  return (
    <Stack spacing={2}>
      {missing.length > 0 && (
        <Alert severity="warning" role="status">
          {t('Map a column to each required property: {names}.', {
            names: missing.map((property) => propertyLabel(t, property)).join(', '),
          })}
        </Alert>
      )}
      <TableContainer tabIndex={0} aria-label={t('Column mapping')}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('Column in your file')}</TableCell>
              <TableCell>{t('Sample values')}</TableCell>
              <TableCell sx={{ width: '40%' }}>{t('Import as')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {columns.map((column) => (
              <TableRow key={column.id}>
                <TableCell>
                  <Text weight="medium">{column.header || t('(no heading)')}</Text>
                </TableCell>
                <TableCell>
                  <Text size="sm" color="text.secondary">
                    {column.samples.join(', ') || t('No values')}
                  </Text>
                </TableCell>
                <TableCell>
                  <PropertySelect
                    column={column.header || t('(no heading)')}
                    value={mapping[column.index] ?? null}
                    properties={properties}
                    onChange={(key) => onAssign(column.index, key)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
