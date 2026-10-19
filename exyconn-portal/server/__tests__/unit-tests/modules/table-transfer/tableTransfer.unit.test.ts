import { GraphQLError, buildSchema, type GraphQLFieldResolver } from 'graphql';
import { registerTable } from '../../../../src/modules/table-transfer/registry';
import { importTarget } from '../../../../src/modules/table-transfer/importTarget';
import { tableInfo } from '../../../../src/modules/table-transfer/tableInfo';
import { importTemplate } from '../../../../src/modules/table-transfer/tableTemplate';
import {
  MAX_IMPORT_ROWS_PER_CALL,
  importRows,
} from '../../../../src/modules/table-transfer/tableImport';
import {
  EXPORT_MAX_COLUMNS,
  EXPORT_MAX_ROWS,
  exportTable,
} from '../../../../src/modules/table-transfer/tableExport';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

/**
 * A schema of its own, so every shape a list's import side can take is spelled out: a list
 * with create and update, one with create only, one whose create takes no input object, one
 * whose rows have no id, and one whose update is not keyed by id.
 */
const schema = buildSchema(`
  input FilterIn { field: String op: String value: String }
  input TableQueryInput { page: Int pageSize: Int filters: [FilterIn!] }
  enum Stage { ACTIVE PAUSED }
  type Widget { id: ID! name: String email: String status: Stage }
  type WidgetPage { rows: [Widget!]! totalCount: Int! }
  "What a widget is made of"
  input WidgetInput { name: String! email: String status: Stage = ACTIVE }
  type Note { id: ID! title: String }
  type NotePage { rows: [Note!]! totalCount: Int! }
  input NoteInput { title: String! }
  type Gizmo { id: ID! code: String }
  type GizmoPage { rows: [Gizmo!]! totalCount: Int! }
  type Doodad { code: String }
  type DoodadPage { rows: [Doodad!]! totalCount: Int! }
  input DoodadInput { code: String }
  type Query {
    listWidgetsPaged(input: TableQueryInput!): WidgetPage!
    listNotesPaged(input: TableQueryInput!): NotePage!
    listGizmosPaged(input: TableQueryInput!): GizmoPage!
    listDoodadsPaged(input: TableQueryInput!): DoodadPage!
  }
  type Mutation {
    createWidget(input: WidgetInput!): Widget
    updateWidget(id: ID!, input: WidgetInput!): Boolean
    createNote(input: NoteInput!): Boolean
    updateNote(input: NoteInput!): Boolean
    createGizmo(input: String): Boolean
    createDoodad(input: DoodadInput!): Boolean
    updateDoodad(id: ID!, input: DoodadInput!): Boolean
  }
`);
const noMutations = buildSchema(`
  input TableQueryInput { page: Int }
  type Lone { id: ID! }
  type LonePage { rows: [Lone!]! }
  type Query { listLonesPaged(input: TableQueryInput!): LonePage! }
`);

const filters = ['name', 'email', 'status', 'title', 'code', 'phone'];
registerTable('listWidgetsPaged', { filterFields: filters, sortFields: ['name'] }, [
  'email',
  'phone',
]);
registerTable('listNotesPaged', { filterFields: filters, sortFields: [] }, ['title']);
registerTable('listGizmosPaged', { filterFields: filters, sortFields: [] }, ['code']);
registerTable('listDoodadsPaged', { filterFields: filters, sortFields: [] }, ['code']);
registerTable('listLonesPaged', { filterFields: [], sortFields: [] }, []);
registerTable('listUnimportablePaged', { filterFields: [], sortFields: [] });

interface Widget {
  id: string;
  name: string;
  email: string | null;
  status: string;
}
let widgets: Widget[] = [];

function resolve(
  type: 'Query' | 'Mutation',
  name: string,
  fn: GraphQLFieldResolver<unknown, unknown>,
) {
  const root = type === 'Query' ? schema.getQueryType() : schema.getMutationType();
  const field = root?.getFields()[name];
  if (!field) {
    throw new Error(`no field ${name}`);
  }
  field.resolve = fn;
}

type PageArgs = {
  input: { page: number; pageSize: number; filters?: { field: string; value: string }[] };
};
const listWidgets: GraphQLFieldResolver<unknown, unknown, PageArgs> = (_p, { input }) => {
  const matching = widgets.filter((widget) =>
    (input.filters ?? []).every(
      (filter) =>
        String(widget[filter.field as keyof Widget]).toLowerCase() === filter.value.toLowerCase(),
    ),
  );
  const start = input.page * input.pageSize;
  return { rows: matching.slice(start, start + input.pageSize), totalCount: matching.length };
};
resolve('Query', 'listWidgetsPaged', listWidgets);
resolve('Mutation', 'createWidget', (_p, { input }: { input: Omit<Widget, 'id'> }) => {
  if (input.name === 'Forbidden') {
    throw new GraphQLError('Your role may not create Widget', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  const widget = { id: `w${widgets.length + 1}`, ...input };
  widgets.push(widget);
  return widget;
});
resolve(
  'Mutation',
  'updateWidget',
  (_p, { id, input }: { id: string; input: Omit<Widget, 'id'> }) => {
    widgets = widgets.map((widget) => (widget.id === id ? { ...widget, ...input } : widget));
    return true;
  },
);

const admin = {
  user: { id: 'u1', email: 'a@x.com', roles: [ROLES.ADMIN] },
} as unknown as GraphQLContext;
const roleless = { user: { id: 'u2', email: 'b@x.com' } } as unknown as GraphQLContext;

const seed = (...rows: Omit<Widget, 'id'>[]) => {
  widgets = rows.map((row, index) => ({ id: `w${index + 1}`, ...row }));
};
const audits = () => runAsPlatform(() => AuditLogModel.find().lean());

beforeEach(() => {
  widgets = [];
  resolve('Query', 'listWidgetsPaged', listWidgets);
});

describe('importTarget', () => {
  it('describes create, update and the match fields both sides can use', () => {
    const target = importTarget(schema, 'listWidgetsPaged');
    expect(target?.create).toMatchObject({
      name: 'createWidget',
      variables: '$input: WidgetInput!',
      args: 'input: $input',
      selection: '{ __typename }',
    });
    expect(target?.update).toMatchObject({
      variables: '$id: ID!, $input: WidgetInput!',
      args: 'id: $id, input: $input',
      selection: '',
    });
    expect(target?.matchFields).toEqual(['email']);
  });

  it('offers create only when there is no update keyed by id, or the rows have no id', () => {
    expect(importTarget(schema, 'listNotesPaged')).toMatchObject({ update: null, matchFields: [] });
    expect(importTarget(schema, 'listDoodadsPaged')?.matchFields).toEqual([]);
  });

  it('takes no import without a registration, a create input object, or any mutation', () => {
    expect(importTarget(schema, 'listUnimportablePaged')).toBeNull();
    expect(importTarget(schema, 'listGizmosPaged')).toBeNull();
    expect(importTarget(noMutations, 'listLonesPaged')).toBeNull();
  });
});

describe('tableInfo', () => {
  it('types the filters the row exposes and describes the import', () => {
    const info = tableInfo(schema, 'listWidgetsPaged');
    expect(info.filters.map((filter) => filter.field)).toEqual(['name', 'email', 'status']);
    expect(info.filters[2]).toEqual({
      field: 'status',
      kind: 'ENUM',
      options: ['ACTIVE', 'PAUSED'],
    });
    expect(info).toMatchObject({ sortFields: ['name'], importable: true, matchFields: ['email'] });
    expect(info.importFields.map((field) => field.field)).toEqual(['name', 'email', 'status']);
  });

  it('says a list without an import takes none, and refuses an unregistered list', () => {
    expect(tableInfo(schema, 'listGizmosPaged')).toMatchObject({
      importable: false,
      matchFields: [],
      importFields: [],
    });
    expect(() => tableInfo(schema, 'listNobodyPaged')).toThrow(
      'listNobodyPaged is not a registered table',
    );
  });
});

describe('importTemplate', () => {
  it('heads the columns as the grid does, explaining each on a second sheet', async () => {
    const file = await importTemplate(schema, admin, {
      list: 'listWidgetsPaged',
      format: 'CSV',
      fileName: 'widgets',
      columns: [{ field: 'name', header: 'Widget name' }],
    });
    const text = Buffer.from(file.contentBase64, 'base64').toString('utf8');
    expect(text).toBe('﻿Widget name,Email,Status');
    expect(file.rowCount).toBe(0);

    const plain = await importTemplate(schema, admin, {
      list: 'listNotesPaged',
      format: 'CSV',
      fileName: 'notes',
    });
    expect(Buffer.from(plain.contentBase64, 'base64').toString('utf8')).toBe('﻿Title');
  });

  it('refuses a list that takes no import, and an anonymous caller', async () => {
    const args = { list: 'listGizmosPaged', format: 'CSV' as const, fileName: 'g' };
    await expect(importTemplate(schema, admin, args)).rejects.toThrow(
      'listGizmosPaged does not take imports',
    );
    await expect(codeOf(importTemplate(schema, {} as GraphQLContext, args))).resolves.toBe(
      'UNAUTHENTICATED',
    );
  });
});

describe('importRows', () => {
  const run = (
    rows: unknown[],
    mode: 'CREATE' | 'UPDATE' | 'UPSERT' = 'CREATE',
    matchField?: string,
  ) =>
    importRows(schema, admin, {
      list: 'listWidgetsPaged',
      mode,
      matchField,
      rows,
      firstRowNumber: 2,
    });

  it('reports a row that is not a set of columns, skips a blank one, and audits the rest', async () => {
    const result = await run([['Asha'], null, { name: ' ', email: '' }, { name: 'Bina' }]);
    expect(result).toEqual({
      created: 1,
      updated: 0,
      skipped: 1,
      issues: [
        { row: 2, message: 'The row is not a set of columns', skipped: false },
        { row: 3, message: 'The row is not a set of columns', skipped: false },
      ],
    });
    const [entry] = await audits();
    expect(entry).toMatchObject({
      action: 'IMPORT',
      module: 'Widget',
      summary: 'Imported Widget: 1 created, 0 updated',
    });
  });

  it('keeps only the reason of a coercion error and the message of a bad cell', async () => {
    const result = await run([{ email: 'a@x.com' }, { name: 'Asha', status: 'gone' }]);
    expect(result.created).toBe(0);
    expect(result.issues).toEqual([
      {
        row: 2,
        message: 'Field "name" of required type "String!" was not provided.',
        skipped: false,
      },
      { row: 3, message: 'status must be one of ACTIVE, PAUSED', skipped: false },
    ]);
    expect(await audits()).toHaveLength(0);
  });

  it('updates the record its match column names and creates the rest on UPSERT', async () => {
    seed({ name: 'Asha', email: 'asha@x.com', status: 'ACTIVE' });
    const result = await run(
      [
        { name: 'Asha K', email: 'asha@x.com', status: 'paused' },
        { name: 'Chen', email: 'chen@x.com' },
        { name: 'Dev' },
      ],
      'UPSERT',
      'email',
    );
    expect(result).toMatchObject({ created: 2, updated: 1, skipped: 0 });
    expect(widgets.map((widget) => widget.name)).toEqual(['Asha K', 'Chen', 'Dev']);
  });

  it('skips a row UPDATE cannot match, saying what it looked for', async () => {
    seed({ name: 'Asha', email: 'asha@x.com', status: 'ACTIVE' });
    const result = await run(
      [{ name: 'Ghost', email: 'ghost@x.com' }, { name: 'Blank' }],
      'UPDATE',
      'email',
    );
    expect(result).toEqual({
      created: 0,
      updated: 0,
      skipped: 2,
      issues: [
        { row: 2, message: 'No record has email ghost@x.com', skipped: true },
        { row: 3, message: 'No record has email (blank)', skipped: true },
      ],
    });
  });

  it('refuses to guess between two records with the same match value', async () => {
    seed(
      { name: 'One', email: 'same@x.com', status: 'ACTIVE' },
      { name: 'Two', email: 'same@x.com', status: 'ACTIVE' },
    );
    const result = await run([{ name: 'Three', email: 'same@x.com' }], 'UPSERT', 'email');
    expect(result.issues).toEqual([
      { row: 2, message: 'More than one record has email same@x.com', skipped: false },
    ]);
  });

  it('stops the chunk at a refusal of the caller', async () => {
    await expect(
      codeOf(run([{ name: 'Asha' }, { name: 'Forbidden' }, { name: 'Bina' }])),
    ).resolves.toBe('FORBIDDEN');
    expect(widgets.map((widget) => widget.name)).toEqual(['Asha']);
  });

  it('refuses a list without an import, too many rows, and a mode without its match column', async () => {
    await expect(
      importRows(schema, admin, {
        list: 'listGizmosPaged',
        mode: 'CREATE',
        rows: [],
        firstRowNumber: 2,
      }),
    ).rejects.toThrow('listGizmosPaged does not take imports');
    const rows = Array.from({ length: MAX_IMPORT_ROWS_PER_CALL + 1 }, () => ({ name: 'x' }));
    await expect(run(rows)).rejects.toThrow(
      `Send at most ${MAX_IMPORT_ROWS_PER_CALL} rows per call`,
    );
    await expect(run([{ name: 'x' }], 'UPDATE')).rejects.toThrow(
      'Pick the column that identifies an existing record',
    );
    await expect(run([{ name: 'x' }], 'UPSERT', 'name')).rejects.toThrow(
      'Pick the column that identifies an existing record',
    );
  });
});

describe('exportTable', () => {
  const columns = [
    { field: 'name', header: 'Name' },
    { field: 'status', header: 'Status' },
  ];
  const exported = (ctx: GraphQLContext, overrides: Record<string, unknown> = {}) =>
    exportTable(schema, ctx, {
      list: 'listWidgetsPaged',
      input: { page: 0, pageSize: 25 },
      columns,
      format: 'CSV',
      fileName: 'Widgets',
      ...overrides,
    });

  it('reads every page and records the export', async () => {
    seed(
      ...Array.from({ length: 205 }, (_v, i) => ({ name: `W${i}`, email: null, status: 'ACTIVE' })),
    );
    const file = await exported(admin);
    expect(file.rowCount).toBe(205);
    const [entry] = await audits();
    expect(entry).toMatchObject({ action: 'ACCESS', summary: 'Exported 205 Widget rows as CSV' });
  });

  it('stops at an empty page even when the total promised more', async () => {
    seed({ name: 'Asha', email: null, status: 'ACTIVE' });
    resolve('Query', 'listWidgetsPaged', () => ({ rows: [], totalCount: 3 }));
    await expect(exported(admin)).resolves.toMatchObject({ rowCount: 0 });
  });

  it('refuses more rows than one file holds', async () => {
    resolve('Query', 'listWidgetsPaged', () => ({ rows: [], totalCount: EXPORT_MAX_ROWS + 1 }));
    await expect(exported(admin)).rejects.toThrow(
      `There are ${EXPORT_MAX_ROWS + 1} rows to export; up to ${EXPORT_MAX_ROWS} fit in one file.`,
    );
  });

  it('refuses no columns, too many, and an overlong heading', async () => {
    const many = Array.from({ length: EXPORT_MAX_COLUMNS + 1 }, () => ({
      field: 'name',
      header: 'N',
    }));
    for (const bad of [[], many]) {
      await expect(exported(admin, { columns: bad })).rejects.toThrow(
        `Export between 1 and ${EXPORT_MAX_COLUMNS} columns`,
      );
    }
    await expect(
      exported(admin, { columns: [{ field: 'name', header: 'h'.repeat(201) }] }),
    ).rejects.toThrow('A column heading is limited to 200 characters');
  });

  it('refuses a caller whose token carries no roles', async () => {
    await expect(exported(roleless)).rejects.toThrow('Your role may not export Widget');
  });
});
