import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEmployeeNames } from '../../../src/hooks/useEmployeeNames';

const users = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListUsersQuery: () => users.query(),
}));

describe('useEmployeeNames', () => {
  it('resolves an employee id to the name from listUsers', () => {
    users.query.mockReturnValue({
      data: {
        listUsers: [
          { id: 'user-1', name: 'Asha Rao' },
          { id: 'user-2', name: 'Bo Chen' },
        ],
      },
    });
    const { result } = renderHook(() => useEmployeeNames());

    expect(result.current('user-1')).toBe('Asha Rao');
    expect(result.current('user-2')).toBe('Bo Chen');
  });

  it('falls back to the id for a deleted account, so the row stays traceable', () => {
    users.query.mockReturnValue({ data: { listUsers: [{ id: 'user-1', name: 'Asha Rao' }] } });
    const { result } = renderHook(() => useEmployeeNames());

    expect(result.current('user-9')).toBe('user-9');
  });

  it('shows ids until the user list has loaded', () => {
    users.query.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useEmployeeNames());

    expect(result.current('user-1')).toBe('user-1');
  });

  it('keeps the same lookup between renders while the list is unchanged', () => {
    const data = { listUsers: [{ id: 'user-1', name: 'Asha Rao' }] };
    users.query.mockReturnValue({ data });
    const { result, rerender } = renderHook(() => useEmployeeNames());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
