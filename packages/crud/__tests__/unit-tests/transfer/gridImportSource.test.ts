import { describe, expect, it } from 'vitest';
import type { ColDef } from 'ag-grid-community';
import { TableFieldKind, TableImportMode } from '@exyconn/shell/graphql/generated';
import { exportColumnsOf } from '../../../src/transfer/exportColumns';
import { importFieldOptions, importModes } from '../../../src/transfer/gridImportSource';

const shout = (text: string) => text.toUpperCase();

describe('exportColumnsOf', () => {
  it('keeps the field-backed display columns, headed through t', () => {
    const columnDefs: ColDef<{ name: string }>[] = [
      { field: 'name', headerName: 'Name' },
      { field: 'owner.name' as 'name', headerName: 'Owner' },
      { headerName: 'Computed', valueGetter: () => 'x' },
      { field: 'name', colId: 'actions', headerName: 'Actions' },
      { field: 'name' },
    ];
    expect(exportColumnsOf(columnDefs, shout)).toEqual([
      { field: 'name', header: 'NAME' },
      { field: 'owner.name', header: 'OWNER' },
    ]);
  });
});

describe('importFieldOptions', () => {
  const field = (name: string, kind: TableFieldKind, required = false) => ({
    field: name,
    kind,
    required,
    options: [],
  });

  it("labels a field as the grid heads it, else by its name, with its kind's label", () => {
    const options = importFieldOptions(
      [field('companyName', TableFieldKind.Text, true), field('dealValue', TableFieldKind.Number)],
      [{ field: 'companyName', header: 'Company' }],
      shout,
    );
    expect(options).toEqual([
      {
        key: 'companyName',
        label: 'Company',
        required: true,
        typeLabel: 'TEXT',
        aliases: ['Company name'],
      },
      {
        key: 'dealValue',
        label: 'DEAL VALUE',
        required: false,
        typeLabel: 'NUMBER',
        aliases: ['Deal value'],
      },
    ]);
  });

  it('describes every kind of value', () => {
    const kinds = Object.values(TableFieldKind);
    const labels = importFieldOptions(
      kinds.map((kind) => field(kind, kind)),
      [],
      (text) => text,
    ).map((option) => option.typeLabel);
    expect(labels).toEqual(['Yes/No', 'Date', 'Choice', 'List', 'Number', 'JSON', 'Text']);
  });
});

describe('importModes', () => {
  it('offers upsert, create and update with a match field and EDIT', () => {
    expect(importModes('email', true).map((entry) => entry.mode)).toEqual([
      TableImportMode.Upsert,
      TableImportMode.Create,
      TableImportMode.Update,
    ]);
  });

  it('only creates without a match field or without EDIT', () => {
    expect(importModes(null, true)).toEqual([
      { mode: TableImportMode.Create, label: 'Create new records' },
    ]);
    expect(importModes('email', false).map((entry) => entry.mode)).toEqual([
      TableImportMode.Create,
    ]);
  });
});
