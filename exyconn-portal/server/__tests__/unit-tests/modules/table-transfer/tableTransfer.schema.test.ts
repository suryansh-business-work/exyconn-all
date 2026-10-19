import { ApolloServer } from '@apollo/server';
import { buildASTSchema, concatAST } from 'graphql';
import ExcelJS from 'exceljs';
import { Types } from 'mongoose';
import { typeDefs, resolvers } from '../../../../src/graphql';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { RolePermissionModel } from '../../../../src/modules/permissions/permission.model';
import { AuditLogModel } from '../../../../src/modules/audit/audit.model';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { registeredTable } from '../../../../src/modules/table-transfer/registry';
import { isPagedList } from '../../../../src/modules/table-transfer/tableSchema';
import { useTestOrganization } from '../../../helpers';

useTestOrganization();

const server = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });

const ctxAs = (roles: Role[]) =>
  ({
    user: { id: new Types.ObjectId().toHexString(), email: 'a@exyconn.com', roles },
  }) as unknown as GraphQLContext;

const ADMIN = ctxAs([ROLES.ADMIN]);

async function run<T>(query: string, variables: Record<string, unknown>, ctx = ADMIN) {
  const response = await server.executeOperation<T>({ query, variables }, { contextValue: ctx });
  if (response.body.kind !== 'single') {
    throw new Error('expected a single result');
  }
  return response.body.singleResult;
}

const EXPORT = `query ($list: String!, $input: TableQueryInput!, $columns: [TableExportColumnInput!]!, $format: TableFileFormat!) {
  tableExport(list: $list, input: $input, columns: $columns, format: $format, fileName: "Clients") {
    fileName mimeType contentBase64 rowCount
  }
}`;
const IMPORT = `mutation ($mode: TableImportMode!, $matchField: String, $rows: [JSON!]!) {
  importTableRows(list: "listClientsPaged", mode: $mode, matchField: $matchField, rows: $rows, firstRowNumber: 2) {
    created updated skipped issues { row message skipped }
  }
}`;

type ExportData = { tableExport: { fileName: string; contentBase64: string; rowCount: number } };
type ImportData = {
  importTableRows: {
    created: number;
    updated: number;
    skipped: number;
    issues: { row: number; message: string; skipped: boolean }[];
  };
};

const decode = (base64: string) => Buffer.from(base64, 'base64').toString('utf8');

function client(name: string, email: string, status = 'ACTIVE') {
  return ClientModel.create({ name, email, phone: '1', company: `${name} Ltd`, status });
}

beforeAll(() => server.start());
afterAll(() => server.stop());
beforeEach(() => invalidatePermissionCache());

describe('tableExport', () => {
  const columns = [
    { field: 'name', header: 'Name' },
    { field: 'email', header: 'Email' },
  ];

  it('writes every row under the search and sort as CSV, through the list resolver', async () => {
    await client('Asha', 'asha@x.com');
    await client('Bina', 'bina@x.com');
    await client('Chen', 'chen@y.com');
    const result = await run<ExportData>(EXPORT, {
      list: 'listClientsPaged',
      input: { page: 0, pageSize: 1, search: 'x.com', sorts: [{ field: 'name', dir: 'DESC' }] },
      columns,
      format: 'CSV',
    });
    expect(result.errors).toBeUndefined();
    const file = result.data?.tableExport;
    expect(file?.rowCount).toBe(2);
    expect(file?.fileName).toMatch(/^clients-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(decode(file?.contentBase64 ?? '')).toBe(
      '﻿Name,Email\r\nBina,bina@x.com\r\nAsha,asha@x.com',
    );
    expect(await AuditLogModel.countDocuments({ action: 'ACCESS', module: 'Client' })).toBe(1);
  });

  it('writes an XLSX workbook', async () => {
    await client('Asha', 'asha@x.com');
    const result = await run<ExportData>(EXPORT, {
      list: 'listClientsPaged',
      input: { page: 0, pageSize: 25 },
      columns,
      format: 'XLSX',
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      Buffer.from(result.data?.tableExport.contentBase64 ?? '', 'base64') as never,
    );
    const sheet = workbook.worksheets[0];
    expect(sheet.getRow(1).values).toEqual([undefined, 'Name', 'Email']);
    expect(sheet.getRow(2).values).toEqual([undefined, 'Asha', 'asha@x.com']);
  });

  it('refuses a role without EXPORT on the module', async () => {
    await RolePermissionModel.create({ role: ROLES.FINANCE, module: 'Client', actions: ['VIEW'] });
    const result = await run<ExportData>(
      EXPORT,
      { list: 'listClientsPaged', input: { page: 0, pageSize: 25 }, columns, format: 'CSV' },
      ctxAs([ROLES.FINANCE]),
    );
    expect(result.errors?.[0].message).toBe('Your role may not export Client');
  });

  it('refuses a column the row type does not expose', async () => {
    const result = await run<ExportData>(EXPORT, {
      list: 'listClientsPaged',
      input: { page: 0, pageSize: 25 },
      columns: [{ field: 'passwordHash', header: 'Secret' }],
      format: 'CSV',
    });
    expect(result.errors?.[0].message).toBe('passwordHash is not a column of Client');
  });
});

describe('importTableRows', () => {
  const row = (email: string, name = 'Asha') => ({
    name,
    email,
    phone: '99',
    company: 'Acme',
    status: 'active',
  });

  it('creates records through createClient and reports a bad row against its line', async () => {
    const result = await run<ImportData>(IMPORT, {
      mode: 'CREATE',
      rows: [row('asha@x.com'), { name: 'No email', status: 'ACTIVE' }, {}],
    });
    expect(result.errors).toBeUndefined();
    const outcome = result.data?.importTableRows;
    expect(outcome).toMatchObject({ created: 1, updated: 0, skipped: 1 });
    expect(outcome?.issues).toHaveLength(1);
    expect(outcome?.issues[0]).toMatchObject({ row: 3, skipped: false });
    expect(outcome?.issues[0].message).not.toContain('Variable');
    expect(await ClientModel.countDocuments({ email: 'asha@x.com', status: 'ACTIVE' })).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: 'IMPORT', module: 'Client' })).toBe(1);
  });

  it('updates the record its match column names and creates the rest on UPSERT', async () => {
    await client('Old', 'asha@x.com');
    const result = await run<ImportData>(IMPORT, {
      mode: 'UPSERT',
      matchField: 'email',
      rows: [row('asha@x.com', 'New'), row('bina@x.com', 'Bina')],
    });
    expect(result.data?.importTableRows).toMatchObject({ created: 1, updated: 1, issues: [] });
    expect((await ClientModel.findOne({ email: 'asha@x.com' }).lean())?.name).toBe('New');
  });

  it('skips a row UPDATE cannot match', async () => {
    const result = await run<ImportData>(IMPORT, {
      mode: 'UPDATE',
      matchField: 'email',
      rows: [row('nobody@x.com')],
    });
    expect(result.data?.importTableRows).toMatchObject({
      created: 0,
      skipped: 1,
      issues: [{ row: 2, message: 'No record has email nobody@x.com', skipped: true }],
    });
  });

  it('refuses a list that takes no import', async () => {
    const result = await run<ImportData>(IMPORT.replace('listClientsPaged', 'listInvoicesPaged'), {
      mode: 'CREATE',
      rows: [],
    });
    expect(result.errors?.[0].message).toBe('listInvoicesPaged does not take imports');
  });
});

describe('import target, template and file parsing', () => {
  it('describes the filters, sorts and import of a list', async () => {
    type Info = {
      tableInfo: {
        filters: { field: string; kind: string; options: string[] }[];
        sortFields: string[];
        importable: boolean;
        matchFields: string[];
        importFields: { field: string; required: boolean; kind: string; options: string[] }[];
      };
    };
    const result = await run<Info>(
      `query { tableInfo(list: "listClientsPaged") { filters { field kind options } sortFields importable matchFields importFields { field required kind options } } }`,
      {},
    );
    const info = result.data?.tableInfo;
    expect(info?.filters).toContainEqual({
      field: 'status',
      kind: 'ENUM',
      options: ['ACTIVE', 'INACTIVE', 'PROSPECT'],
    });
    expect(info?.filters).toContainEqual({ field: 'email', kind: 'TEXT', options: [] });
    expect(info?.sortFields).toContain('createdAt');
    expect(info?.importable).toBe(true);
    expect(info?.matchFields).toEqual(['email']);
    expect(info?.importFields.find((field) => field.field === 'status')).toEqual({
      field: 'status',
      required: true,
      kind: 'ENUM',
      options: ['ACTIVE', 'INACTIVE', 'PROSPECT'],
    });
  });

  it('says a list without import config takes none', async () => {
    const result = await run<{ tableInfo: { importable: boolean; matchFields: string[] } }>(
      `query { tableInfo(list: "listInvoicesPaged") { importable matchFields } }`,
      {},
    );
    expect(result.data?.tableInfo).toEqual({ importable: false, matchFields: [] });
  });

  it('writes a template headed as the grid heads its columns', async () => {
    const result = await run<{ tableImportTemplate: { contentBase64: string } }>(
      `query { tableImportTemplate(list: "listClientsPaged", format: CSV, fileName: "clients", columns: [{ field: "name", header: "Client name" }]) { contentBase64 } }`,
      {},
    );
    const header = decode(result.data?.tableImportTemplate.contentBase64 ?? '');
    expect(header.startsWith('﻿Client name,Email,Phone,Company,Status')).toBe(true);
  });

  it('reads an uploaded CSV', async () => {
    const result = await run<{ parseTableFile: { headers: string[]; rows: string[][] } }>(
      `mutation ($content: String!) { parseTableFile(fileName: "a.csv", contentBase64: $content) { headers rows } }`,
      { content: Buffer.from(' Name ,Email\nAsha,a@x.com\n').toString('base64') },
    );
    expect(result.data?.parseTableFile).toEqual({
      headers: ['Name', 'Email'],
      rows: [['Asha', 'a@x.com']],
    });
  });
});

describe('table registry', () => {
  it('registers every paged list, so no grid offers a filter the server would drop', () => {
    const schema = buildASTSchema(concatAST(typeDefs), { assumeValidSDL: true });
    const paged = Object.values(schema.getQueryType()?.getFields() ?? {}).filter(isPagedList);
    expect(paged.length).toBeGreaterThan(90);
    expect(paged.map((field) => field.name).filter((name) => !registeredTable(name))).toEqual([]);
  });
});
