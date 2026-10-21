import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ApolloClient } from '@apollo/client';
import type { ColDef, ICellRendererParams, ValueFormatterFunc } from 'ag-grid-community';
import type { ComponentType } from 'react';
import type { AuditLogRow } from '@/components/audit';
import { ListUserActivityPagedDocument } from '@/graphql/generated';
import {
  ACTIVITY_COLUMNS,
  ACTIVITY_LIST,
  activityFetcher,
} from '@/pages/UserDetails/employee-activity';
import { makeActivity } from './activityFixture';

const column = (field: string): ColDef<AuditLogRow> => {
  const found = ACTIVITY_COLUMNS.find((col) => col.field === field);
  if (!found) throw new Error(`No ${field} column`);
  return found;
};

const PAGE = { page: 0, pageSize: 25 };

describe('activityFetcher', () => {
  it("asks for one page of the person's activity and names the list it reads", async () => {
    const page = { rows: [makeActivity()], totalCount: 1 };
    const query = vi.fn().mockResolvedValue({ data: { listUserActivityPaged: page } });
    const fetchRows = activityFetcher({ query } as unknown as ApolloClient, 'emp-1');

    await expect(fetchRows(PAGE)).resolves.toEqual(page);
    expect(query).toHaveBeenCalledWith({
      query: ListUserActivityPagedDocument,
      variables: { userId: 'emp-1', input: PAGE },
      fetchPolicy: 'network-only',
    });
    expect(fetchRows.list).toBe(ACTIVITY_LIST);
    expect(fetchRows.variablesFor?.(PAGE)).toEqual({ userId: 'emp-1', input: PAGE });
  });

  it('fails loudly when the server answers without data', async () => {
    const query = vi.fn().mockResolvedValue({});
    const fetchRows = activityFetcher({ query } as unknown as ApolloClient, 'emp-1');
    await expect(fetchRows(PAGE)).rejects.toThrow('The activity query returned no data');
  });
});

describe('ACTIVITY_COLUMNS', () => {
  it('lets the server filter by module and summary, not by time or action', () => {
    expect(column('module').filter).toBeUndefined();
    expect(column('summary').filter).toBeUndefined();
    expect(column('createdAt').filter).toBe(false);
    expect(column('action').filter).toBe(false);
  });

  it("writes the time in the viewer's settings, and nothing for a row still loading", () => {
    const format = column('createdAt').valueFormatter as ValueFormatterFunc<AuditLogRow>;
    const context = { formatDateTime: (value: string) => `at ${value}` };
    const row = makeActivity();
    expect(format({ data: row, context } as never)).toBe(`at ${row.createdAt}`);
    expect(format({ data: undefined, context } as never)).toBe('');
  });

  it('shows the action as a status chip, and nothing for a row still loading', () => {
    const ActionCell = column('action').cellRenderer as ComponentType<
      ICellRendererParams<AuditLogRow>
    >;
    const { container, rerender } = render(
      <ActionCell {...({ data: makeActivity() } as ICellRendererParams<AuditLogRow>)} />,
    );
    expect(screen.getByText('UPDATE')).toBeInTheDocument();
    rerender(<ActionCell {...({ data: undefined } as ICellRendererParams<AuditLogRow>)} />);
    expect(container).toBeEmptyDOMElement();
  });
});
