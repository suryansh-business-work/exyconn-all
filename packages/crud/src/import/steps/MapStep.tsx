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
import type { ImportFieldOption, ImportFile } from '../import.types';
import { sampleValues, unmappedRequired, type ColumnMapping } from '../mapping';
import { FieldSelect } from './FieldSelect';

interface MapStepProps {
  file: ImportFile;
  mapping: ColumnMapping;
  fields: readonly ImportFieldOption[];
  onAssign: (column: number, key: string | null) => void;
}

/** Step 2: say which field each column fills. Required fields must all be mapped. */
export function MapStep({ file, mapping, fields, onAssign }: Readonly<MapStepProps>) {
  const t = useT();
  const missing = unmappedRequired(mapping, fields);
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
          {t('Map a column to each required field: {names}.', {
            names: missing.map((field) => field.label).join(', '),
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
                  <FieldSelect
                    column={column.header || t('(no heading)')}
                    value={mapping[column.index] ?? null}
                    fields={fields}
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
