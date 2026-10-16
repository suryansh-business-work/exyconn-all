import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import {
  ImportDialog as SharedImportDialog,
  downloadCsvTemplate,
  type ImportModeOption,
  type ImportRow,
  type ImportSource,
} from '@exyconn/crud';
import {
  CrmImportMode,
  TableFileFormat,
  useImportCrmRecordsMutation,
  type CrmObject,
} from '@exyconn/shell/graphql/generated';
import { queryData } from '@exyconn/shell/utils/queryData';
import { useObjectSchema } from '../schema';
import { PROPERTY_TYPE_LABEL, propertyLabel } from '../propertyText';
import { HEADER_SYNONYMS } from './synonyms';

interface ImportDialogProps {
  object: CrmObject;
  onImported: () => void;
  onClose: () => void;
}

const MODES: [ImportModeOption<CrmImportMode>, ...ImportModeOption<CrmImportMode>[]] = [
  { mode: CrmImportMode.Upsert, label: 'Create new and update existing' },
  { mode: CrmImportMode.Create, label: 'Create new only' },
  { mode: CrmImportMode.Update, label: 'Update existing only' },
];

/**
 * The shared import wizard, pointed at a CRM record type: its importable properties (built-in
 * then custom), matched by the type's dedupe key and written through `importCrmRecords`.
 */
export function ImportDialog({ object, onImported, onClose }: Readonly<ImportDialogProps>) {
  const t = useT();
  const { properties: all, dedupeKey, error } = useObjectSchema(object);
  const [importRecords] = useImportCrmRecordsMutation();

  const source = useMemo<ImportSource<CrmImportMode>>(() => {
    const properties = all.filter((property) => property.importable);
    const labels = properties.map((property) => propertyLabel(t, property));
    const dedupe = all.find((property) => property.key === dedupeKey);
    return {
      title: t('Import records'),
      fields: properties.map((property, index) => ({
        key: property.key,
        label: labels[index],
        required: property.required,
        group: t(property.builtIn ? 'Built-in' : 'Custom'),
        typeLabel: t(PROPERTY_TYPE_LABEL[property.type]),
        aliases: [property.label],
      })),
      modes: MODES,
      matchLabel: dedupe ? propertyLabel(t, dedupe) : dedupeKey,
      synonyms: HEADER_SYNONYMS,
      templateFormats: [TableFileFormat.Csv],
      downloadTemplate: async () =>
        downloadCsvTemplate(`${object.toLowerCase()}-import-template`, labels),
      loadError: error ? t('The properties could not be loaded.') : null,
      runChunk: async (rows: ImportRow[], mode: CrmImportMode, firstRowNumber: number) => {
        const { data } = await importRecords({
          variables: { input: { object, mode, rows, firstRowNumber } },
        });
        return queryData({ data }, 'The CRM import').importCrmRecords;
      },
    };
  }, [all, dedupeKey, error, importRecords, object, t]);

  return <SharedImportDialog source={source} onImported={onImported} onClose={onClose} />;
}
