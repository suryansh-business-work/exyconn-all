import { fieldHeading } from '@exyconn/csv';
import {
  TableFieldKind,
  TableImportMode,
  type TableExportColumnInput,
  type TableInfoQuery,
} from '@exyconn/shell/graphql/generated';
import type { ImportFieldOption, ImportModeOption } from '../import';

type ImportField = TableInfoQuery['tableInfo']['importFields'][number];

/** How a value of each kind is described in the mapping select. */
const KIND_LABELS: Readonly<Record<TableFieldKind, string>> = {
  [TableFieldKind.Text]: 'Text',
  [TableFieldKind.Number]: 'Number',
  [TableFieldKind.Boolean]: 'Yes/No',
  [TableFieldKind.Date]: 'Date',
  [TableFieldKind.Enum]: 'Choice',
  [TableFieldKind.List]: 'List',
  [TableFieldKind.Object]: 'JSON',
};

const CREATE_ONLY: ImportModeOption<TableImportMode> = {
  mode: TableImportMode.Create,
  label: 'Create new records',
};
const MATCHING_MODES: [ImportModeOption<TableImportMode>, ...ImportModeOption<TableImportMode>[]] =
  [
    { mode: TableImportMode.Upsert, label: 'Create new and update existing' },
    { mode: TableImportMode.Create, label: 'Create new only' },
    { mode: TableImportMode.Update, label: 'Update existing only' },
  ];

/**
 * The fields a file can fill, labelled as the grid heads them (a field the grid does not show
 * gets its name as a heading), so a file exported from the grid maps back on its own.
 */
export function importFieldOptions(
  fields: readonly ImportField[],
  columns: readonly TableExportColumnInput[],
  t: (source: string) => string,
): ImportFieldOption[] {
  const headings = new Map(columns.map((column) => [column.field, column.header]));
  return fields.map((field) => {
    const heading = fieldHeading(field.field);
    return {
      key: field.field,
      label: headings.get(field.field) ?? t(heading),
      required: field.required,
      typeLabel: t(KIND_LABELS[field.kind]),
      aliases: [heading],
    };
  });
}

/** What matching rows can do: only create without a match field or without EDIT. */
export function importModes(
  matchField: string | null,
  canEdit: boolean,
): [ImportModeOption<TableImportMode>, ...ImportModeOption<TableImportMode>[]] {
  return matchField && canEdit ? MATCHING_MODES : [CREATE_ONLY];
}
