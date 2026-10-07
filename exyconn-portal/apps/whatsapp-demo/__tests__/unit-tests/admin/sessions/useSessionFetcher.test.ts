import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { FilterOp, WhatsappDemoSessionsDocument } from '@exyconn/shell/graphql/generated';
import {
  useSessionFetcher,
  type SessionQueryScope,
} from '../../../../src/admin/sessions/useSessionFetcher';
import { sessionRow } from '../admin.fixtures';

const client = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useApolloClient: () => client,
}));

const SEPTEMBER: SessionQueryScope = {
  from: '2026-09-01T00:00:00.000Z',
  to: '2026-09-30T23:59:59.999Z',
  filters: [{ field: 'status', op: FilterOp.Equals, value: 'active' }],
};
const PAGE = { page: 1, pageSize: 25 };

function mount(scope: SessionQueryScope) {
  return renderHook((props: { scope: SessionQueryScope }) => useSessionFetcher(props.scope), {
    initialProps: { scope },
  });
}

beforeEach(() => {
  client.query.mockReset().mockResolvedValue({
    data: { whatsappDemoSessions: { rows: [sessionRow()], totalCount: 41 } },
  });
});

describe('useSessionFetcher', () => {
  it("loads a page for the period, adding the outside filters to the grid's own", async () => {
    const { result } = mount(SEPTEMBER);
    const gridFilter = { field: 'user', op: FilterOp.Contains, value: 'ravi' };
    const page = await result.current.fetchRows({ ...PAGE, filters: [gridFilter] });
    expect(page).toEqual({ rows: [sessionRow()], totalCount: 41 });
    expect(client.query).toHaveBeenCalledWith({
      query: WhatsappDemoSessionsDocument,
      variables: {
        input: { ...PAGE, filters: [gridFilter, ...SEPTEMBER.filters] },
        from: SEPTEMBER.from,
        to: SEPTEMBER.to,
      },
      fetchPolicy: 'network-only',
    });
  });

  it('sends only the outside filters when the grid has none', async () => {
    const { result } = mount({ ...SEPTEMBER, filters: [] });
    await result.current.fetchRows(PAGE);
    expect(client.query.mock.calls[0][0].variables.input).toEqual({ ...PAGE, filters: [] });
  });

  it('fails loudly when the server sends no data', async () => {
    client.query.mockResolvedValue({ data: undefined });
    const { result } = mount(SEPTEMBER);
    await expect(result.current.fetchRows(PAGE)).rejects.toThrow(
      'WhatsappDemoSessions returned no data',
    );
  });

  it('keeps one loader and signals a reload only when the scope changes', async () => {
    const { result, rerender } = mount(SEPTEMBER);
    const { fetchRows } = result.current;
    expect(result.current.refreshSignal).toBe(0);

    rerender({ scope: { ...SEPTEMBER, filters: [...SEPTEMBER.filters] } });
    expect(result.current.refreshSignal).toBe(0);

    const october = { ...SEPTEMBER, from: '2026-10-01T00:00:00.000Z', filters: [] };
    rerender({ scope: october });
    expect(result.current.refreshSignal).toBe(1);
    expect(result.current.fetchRows).toBe(fetchRows);

    // The same loader now reads the new scope.
    await result.current.fetchRows(PAGE);
    expect(client.query.mock.calls[0][0].variables).toMatchObject({
      from: october.from,
      input: { filters: [] },
    });
  });
});
