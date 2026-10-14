import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEmployeeNames } from '../../../src/hooks/useEmployeeNames';

const people = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListEmployeeNamesQuery: () => people.query(),
}));

describe('useEmployeeNames', () => {
  it('resolves an employee id to the name from listEmployeeNames', () => {
    people.query.mockReturnValue({
      data: {
        listEmployeeNames: [
          { id: 'user-1', name: 'Asha Rao', isActive: true },
          { id: 'user-2', name: 'Bo Chen', isActive: true },
        ],
      },
    });
    const { result } = renderHook(() => useEmployeeNames());

    expect(result.current('user-1')).toBe('Asha Rao');
    expect(result.current('user-2')).toBe('Bo Chen');
  });

  it('keeps the name of a deleted or deactivated person and marks it', () => {
    people.query.mockReturnValue({
      data: { listEmployeeNames: [{ id: 'user-1', name: 'Asha Rao', isActive: false }] },
    });
    const { result } = renderHook(() => useEmployeeNames());

    expect(result.current('user-1')).toBe('Asha Rao (Deactivated)');
  });

  it('falls back to the id for an account erased before deletes were kept', () => {
    people.query.mockReturnValue({
      data: { listEmployeeNames: [{ id: 'user-1', name: 'Asha Rao', isActive: true }] },
    });
    const { result } = renderHook(() => useEmployeeNames());

    expect(result.current('user-9')).toBe('user-9');
  });

  it('shows ids until the names have loaded', () => {
    people.query.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useEmployeeNames());

    expect(result.current('user-1')).toBe('user-1');
  });

  it('keeps the same lookup between renders while the list is unchanged', () => {
    const data = { listEmployeeNames: [{ id: 'user-1', name: 'Asha Rao', isActive: true }] };
    people.query.mockReturnValue({ data });
    const { result, rerender } = renderHook(() => useEmployeeNames());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});
