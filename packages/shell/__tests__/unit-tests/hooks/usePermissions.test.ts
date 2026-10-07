import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMyPermissionsQuery } from '@/graphql/generated';
import { usePermissions } from '@/hooks/usePermissions';
import { seedSession, makeUser } from '../test-utils';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useMyPermissionsQuery: vi.fn(),
}));

type QueryResult = ReturnType<typeof useMyPermissionsQuery>;

const ROWS = [
  {
    module: 'hr',
    view: true,
    create: false,
    edit: true,
    delete: false,
    approve: true,
    export: false,
  },
];

function answer(result: Partial<QueryResult>) {
  vi.mocked(useMyPermissionsQuery).mockReturnValue(result as QueryResult);
}

beforeEach(() => {
  vi.mocked(useMyPermissionsQuery).mockReset();
});

describe('usePermissions', () => {
  it('does not ask without a portal session', () => {
    answer({ data: undefined, loading: false });
    renderHook(() => usePermissions());
    expect(useMyPermissionsQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-first', skip: true });
  });

  it('asks once a portal session exists', () => {
    seedSession(makeUser());
    answer({ data: undefined, loading: true });
    const { result } = renderHook(() => usePermissions());
    expect(useMyPermissionsQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-first', skip: false });
    expect(result.current.loading).toBe(true);
  });

  it('allows everything while the matrix is loading', () => {
    answer({ data: undefined, loading: true });
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can('hr', 'delete')).toBe(true);
  });

  it("answers from the module's row", () => {
    answer({ data: { myPermissions: ROWS }, loading: false } as Partial<QueryResult>);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can('hr', 'edit')).toBe(true);
    expect(result.current.can('hr', 'create')).toBe(false);
    expect(result.current.can('hr', 'delete')).toBe(false);
    expect(result.current.can('hr', 'approve')).toBe(true);
    expect(result.current.loading).toBe(false);
  });

  it('allows a module with no restriction row', () => {
    answer({ data: { myPermissions: ROWS }, loading: false } as Partial<QueryResult>);
    const { result } = renderHook(() => usePermissions());
    expect(result.current.can('finance', 'delete')).toBe(true);
  });
});
