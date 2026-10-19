import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CrmObject } from '@exyconn/shell/graphql/generated';
import { RecordActions } from '../../../src/records/RecordActions';
import { renderWithProviders } from '../test-utils';

const seen = vi.hoisted(() => ({ importProps: {} as object, exportProps: {} as object }));

vi.mock('../../../src/records/import', () => ({
  ImportRecordsButton: (props: object) => {
    seen.importProps = props;
    return <button type="button">Import</button>;
  },
}));
vi.mock('../../../src/records/export', () => ({
  ExportRecordsButton: (props: object) => {
    seen.exportProps = props;
    return <button type="button">Export</button>;
  },
}));

describe('RecordActions', () => {
  it('puts import beside an export of the current view and its columns', () => {
    const onImported = vi.fn();
    const query = { search: 'acme', groups: [], sorts: [], columns: ['name', 'email'] };
    renderWithProviders(
      <RecordActions
        object={CrmObject.Lead}
        query={query}
        fileName="leads"
        onImported={onImported}
      />,
    );
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Import',
      'Export',
    ]);
    expect(seen.importProps).toEqual({ object: CrmObject.Lead, onImported });
    expect(seen.exportProps).toEqual({
      object: CrmObject.Lead,
      query,
      columns: ['name', 'email'],
      fileName: 'leads',
    });
  });
});
