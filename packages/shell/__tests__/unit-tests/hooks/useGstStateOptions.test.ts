import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGstStatesQuery } from '@/graphql/generated';
import { useGstStateOptions } from '@/hooks/useGstStateOptions';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useGstStatesQuery: vi.fn(),
}));

type QueryResult = ReturnType<typeof useGstStatesQuery>;

function answer(data: QueryResult['data']) {
  vi.mocked(useGstStatesQuery).mockReturnValue({ data } as QueryResult);
}

describe('useGstStateOptions', () => {
  it('offers only the blank choice until the states arrive', () => {
    answer(undefined);
    const { result } = renderHook(() => useGstStateOptions());
    expect(result.current).toEqual([{ value: '', label: 'Not set' }]);
  });

  it("lists the server's states after the blank choice, code first", () => {
    answer({
      gstStates: [
        { code: '27', name: 'Maharashtra' },
        { code: '29', name: 'Karnataka' },
      ],
    } as QueryResult['data']);
    const { result } = renderHook(() => useGstStateOptions());
    expect(result.current).toEqual([
      { value: '', label: 'Not set' },
      { value: '27', label: '27 — Maharashtra' },
      { value: '29', label: '29 — Karnataka' },
    ]);
  });

  it('labels the blank choice as the form asks', () => {
    answer({ gstStates: [] } as unknown as QueryResult['data']);
    const { result } = renderHook(() => useGstStateOptions('Any state'));
    expect(result.current).toEqual([{ value: '', label: 'Any state' }]);
  });
});
