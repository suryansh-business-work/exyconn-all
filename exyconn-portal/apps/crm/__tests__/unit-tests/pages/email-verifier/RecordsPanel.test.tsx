import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ICellRendererParams } from 'ag-grid-community';
import { EmailVerificationsPagedDocument } from '@exyconn/shell/graphql/generated';
import { RecordsPanel } from '../../../../src/pages/email-verifier/RecordsPanel';
import { renderWithProviders, createWrapper } from '../../test-utils';
import { paged } from '../../crud-dashboard-stub';
import { toolsGridProps } from '../tools-grid-stub';
import { verification } from './email-verifier-fixtures';

vi.mock('@exyconn/crud', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/crud')>()),
  usePagedFetcher: (await import('../../crud-dashboard-stub')).usePagedFetcherStub,
}));

vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () => ({
  ServerDataGrid: (await import('../tools-grid-stub')).ToolsGridStub,
}));

type StatusRenderer = (params: Readonly<Partial<ICellRendererParams>>) => ReactElement | null;

describe('RecordsPanel', () => {
  it('pages every checked address through the server grid', () => {
    renderWithProviders(<RecordsPanel />);
    const page = { totalCount: 1, rows: [verification()] };

    expect(paged.document).toBe(EmailVerificationsPagedDocument);
    expect(paged.select?.({ emailVerificationsPaged: page } as never)).toBe(page);
    expect(toolsGridProps().fetchRows).toBe(paged.fetchRows);
    expect(screen.getByText('Search by email, reason or who checked it…')).toBeInTheDocument();
    expect(typeof toolsGridProps().context.formatDate).toBe('function');
  });

  it('shows the email, result, reason, source and who checked it, and when', () => {
    renderWithProviders(<RecordsPanel />);

    expect(toolsGridProps().columnDefs.map((column) => column.field)).toEqual([
      'email',
      'status',
      'reason',
      'source',
      'checkedBy',
      'checkedAt',
    ]);
  });

  it('draws the result as the shared verification badge, and nothing for an empty row', () => {
    renderWithProviders(<RecordsPanel />);
    const StatusCell = toolsGridProps().columnDefs[1].cellRenderer as StatusRenderer;

    render(<StatusCell data={verification()} />, { wrapper: createWrapper() });
    expect(screen.getByRole('img', { name: /^Verified: / })).toBeInTheDocument();

    const { container } = render(<StatusCell data={undefined} />, { wrapper: createWrapper() });
    expect(container).toBeEmptyDOMElement();
  });
});
