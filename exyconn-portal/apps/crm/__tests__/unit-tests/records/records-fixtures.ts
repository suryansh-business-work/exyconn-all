import { CrmObject, CrmOp, CrmPropertyType, SortDir } from '@exyconn/shell/graphql/generated';
import type { CrmPropertyInfo, CrmRecordRow } from '../../../src/records/schema';
import type { CrmViewRow } from '../../../src/records/list/recordQuery';

/** One property of a record type, as `crmObjectSchema` describes it; built-in Text by default. */
export function property(overrides: Partial<CrmPropertyInfo> = {}): CrmPropertyInfo {
  return {
    __typename: 'CrmPropertyInfo',
    key: 'name',
    label: 'Name',
    type: CrmPropertyType.Text,
    required: false,
    builtIn: true,
    importable: true,
    description: '',
    filterOnly: false,
    ops: [CrmOp.Contains],
    options: [],
    ...overrides,
  };
}

/** A choice property (dropdown by default) with the given `value: label` options. */
export function choiceProperty(
  options: Readonly<Record<string, string>>,
  overrides: Partial<CrmPropertyInfo> = {},
): CrmPropertyInfo {
  return property({
    key: 'stage',
    label: 'Stage',
    type: CrmPropertyType.Enum,
    options: Object.entries(options).map(([value, label]) => ({
      __typename: 'CrmPropertyOption',
      value,
      label,
    })),
    ...overrides,
  });
}

/** A record row: built-in fields at the top, custom ones under `custom`. */
export function recordRow(overrides: Partial<CrmRecordRow> = {}): CrmRecordRow {
  return { id: 'record-1', ...overrides };
}

/** `useObjectSchema`'s answer for a list of properties. */
export function objectSchema(properties: CrmPropertyInfo[], dedupeKey = 'email') {
  return {
    properties,
    fields: properties.filter((one) => !one.filterOnly),
    dedupeKey,
    loading: false,
    error: undefined,
    refetch: () => Promise.resolve({}),
  };
}

/** A saved view as `crmViews` returns it: "Hot leads", mine, filtering stage = HOT. */
export function crmView(overrides: Partial<CrmViewRow> = {}): CrmViewRow {
  return {
    __typename: 'CrmView',
    id: 'view-1',
    object: CrmObject.Lead,
    name: 'Hot leads',
    shared: false,
    mine: true,
    ownerName: 'Priya',
    search: 'acme',
    columns: ['name', 'email'],
    groups: [
      {
        __typename: 'CrmFilterGroup',
        conditions: [
          { __typename: 'CrmCondition', property: 'stage', op: CrmOp.In, values: ['HOT'] },
        ],
      },
    ],
    sorts: [{ __typename: 'CrmSort', property: 'name', dir: SortDir.Asc }],
    ...overrides,
  };
}
