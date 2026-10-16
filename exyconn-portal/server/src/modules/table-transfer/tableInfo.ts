import type { GraphQLSchema } from 'graphql';
import { badRequest } from '../../utils/errors';
import { importTarget } from './importTarget';
import { enumOptions, typeKind, type FieldKind, type ImportField } from './importValues';
import { registeredTable } from './registry';
import { listTarget } from './tableSchema';

/** A column a filter may target, with the kind of filter its type takes. */
export interface FilterColumn {
  field: string;
  kind: FieldKind;
  options: string[];
}

export interface TableInfo {
  filters: FilterColumn[];
  sortFields: readonly string[];
  importable: boolean;
  matchFields: string[];
  importFields: ImportField[];
}

/**
 * What a grid may ask of a paged list: the columns it can filter (typed from the row's schema,
 * so a date gets a date filter and an enum its values), the columns it can sort, and whether
 * a file can be imported into it.
 */
export function tableInfo(schema: GraphQLSchema, list: string): TableInfo {
  const table = registeredTable(list);
  if (!table) {
    badRequest(`${list} is not a registered table`);
  }
  const rowFields = listTarget(schema, list).rowType.getFields();
  const filters = table.filterFields
    .filter((field) => field in rowFields)
    .map((field) => ({
      field,
      kind: typeKind(rowFields[field].type),
      options: enumOptions(rowFields[field].type),
    }));
  const target = importTarget(schema, list);
  return {
    filters,
    sortFields: table.sortFields,
    importable: target !== null,
    matchFields: target?.matchFields ?? [],
    importFields: target?.fields ?? [],
  };
}
