import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AudienceResolutionRecipientsDocument,
  PreviewAudienceRecipientsDocument,
  type AudienceListInput,
} from '@exyconn/shell/graphql/generated';
import type { GridFetcher } from '@exyconn/shell/components/data/ServerDataGrid.types';
import { AudienceRecipientsGrid } from '../../../../src/pages/audiences/AudienceRecipientsGrid';
import { RECIPIENT_COLUMNS } from '../../../../src/pages/audiences/audience-recipients-grid';
import type { RecipientRow } from '../../../../src/pages/audiences/audience-recipients-grid';
import { renderWithProviders } from '../../test-utils';
import { audienceRow } from '../../fixtures';
import { recipientRow } from './audience.fixtures';
import { toInput, toFormValues } from '../../../../src/pages/audiences/forms/audience-list';

interface GridProps {
  columnDefs: unknown;
  fetchRows: GridFetcher<RecipientRow>;
  searchPlaceholder: string;
  height: number;
}

const grid = vi.hoisted(() => {
  const query = vi.fn();
  // One client for the whole test, as ApolloProvider gives: the fetcher may depend on it.
  return { props: [] as GridProps[], query, client: { query } };
});

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => grid.client,
}));

vi.mock('@exyconn/shell/components/data/ServerDataGrid', () => ({
  ServerDataGrid: (props: GridProps) => {
    grid.props.push(props);
    return <p>Recipients grid</p>;
  },
}));

const PAGE = { page: 2, pageSize: 25, search: 'priya' };
const latest = () => grid.props[grid.props.length - 1];
const DRAFT: AudienceListInput = toInput(toFormValues(audienceRow()));
const PAGE_RESULT = { rows: [recipientRow()], totalCount: 1 };

describe('AudienceRecipientsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    grid.props = [];
  });

  it('shows the recipient columns, searchable by address, name or company', () => {
    renderWithProviders(<AudienceRecipientsGrid target={{ audienceId: 'audience-1' }} />);

    expect(latest().columnDefs).toBe(RECIPIENT_COLUMNS);
    expect(latest().searchPlaceholder).toBe('Search email, contact or company…');
    expect(latest().height).toBe(480);
  });

  it('pages through a saved audience, resolved afresh', async () => {
    grid.query.mockResolvedValue({
      data: { audienceResolution: { recipients: PAGE_RESULT } },
    });
    renderWithProviders(<AudienceRecipientsGrid target={{ audienceId: 'audience-1' }} />);

    await expect(latest().fetchRows(PAGE)).resolves.toEqual(PAGE_RESULT);
    expect(grid.query).toHaveBeenCalledWith({
      query: AudienceResolutionRecipientsDocument,
      variables: { id: 'audience-1', page: PAGE },
      fetchPolicy: 'network-only',
    });
  });

  it('pages through the unsaved settings of the form', async () => {
    grid.query.mockResolvedValue({ data: { previewAudience: { recipients: PAGE_RESULT } } });
    renderWithProviders(<AudienceRecipientsGrid target={{ draft: DRAFT }} />);

    await expect(latest().fetchRows(PAGE)).resolves.toEqual(PAGE_RESULT);
    expect(grid.query).toHaveBeenCalledWith({
      query: PreviewAudienceRecipientsDocument,
      variables: { input: DRAFT, page: PAGE },
      fetchPolicy: 'network-only',
    });
  });

  it('shows an empty page when the server answers without data', async () => {
    grid.query.mockResolvedValue({ data: undefined });
    const saved = renderWithProviders(
      <AudienceRecipientsGrid target={{ audienceId: 'audience-1' }} />,
    );
    await expect(latest().fetchRows(PAGE)).resolves.toEqual({ rows: [], totalCount: 0 });
    saved.unmount();

    renderWithProviders(<AudienceRecipientsGrid target={{ draft: DRAFT }} />);
    await expect(latest().fetchRows(PAGE)).resolves.toEqual({ rows: [], totalCount: 0 });
  });

  it('passes a query failure on to the grid', async () => {
    grid.query.mockRejectedValue(new Error('Network down'));
    renderWithProviders(<AudienceRecipientsGrid target={{ audienceId: 'audience-1' }} />);

    await expect(latest().fetchRows(PAGE)).rejects.toThrow('Network down');
  });

  it('keeps the same fetcher for equal settings, and a new one when they change', () => {
    const { rerender } = renderWithProviders(
      <AudienceRecipientsGrid target={{ draft: { ...DRAFT } }} />,
    );
    const first = latest().fetchRows;

    rerender(<AudienceRecipientsGrid target={{ draft: { ...DRAFT } }} />);
    expect(latest().fetchRows).toBe(first);

    rerender(<AudienceRecipientsGrid target={{ draft: { ...DRAFT, name: 'Other' } }} />);
    expect(latest().fetchRows).not.toBe(first);
  });
});
