import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListEmailLogsPagedDocument } from '@exyconn/shell/graphql/generated';
import { EmailLogsPanel } from '../../../../src/pages/email/EmailLogsPanel';
import { LOG_COLUMNS } from '../../../../src/pages/email/email-grids';
import { renderWithProviders } from '../../test-utils';
import { fetchRows, propsOf, recorded, resetHarness } from '../environment-variables/panel.harness';

vi.mock('@exyconn/crud', async () =>
  (await import('../environment-variables/panel.harness')).crudModule(),
);
vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () =>
  (await import('../environment-variables/panel.harness')).propsModule('ServerDataGrid'),
);

describe('EmailLogsPanel', () => {
  beforeEach(() => {
    resetHarness();
  });

  it('lists every send attempt on a read-only paged grid', () => {
    renderWithProviders(<EmailLogsPanel />);
    const grid = propsOf('ServerDataGrid');
    expect(grid).toEqual({
      columnDefs: LOG_COLUMNS,
      fetchRows,
      searchPlaceholder: 'Search by template, recipient, subject or failure…',
    });
  });

  it('reads its rows from the paged email log query', () => {
    renderWithProviders(<EmailLogsPanel />);
    const page = { rows: [], totalCount: 0 };
    expect(recorded.fetcher?.document).toBe(ListEmailLogsPagedDocument);
    expect(recorded.fetcher?.select({ listEmailLogsPaged: page })).toBe(page);
  });
});
