import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIndustries } from '../../../../src/admin/shared/useIndustries';
import { demoRow } from '../admin.fixtures';

const demos = vi.hoisted(() => ({ data: undefined as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWhatsappDemosQuery: () => ({ data: demos.data }),
}));

beforeEach(() => {
  demos.data = undefined;
});

describe('useIndustries', () => {
  it('has no options and echoes keys before the demos load', () => {
    const { result } = renderHook(() => useIndustries());
    expect(result.current.options).toEqual([]);
    expect(result.current.industryName('clinic')).toBe('clinic');
  });

  it('lists the demos in catalogue order and names keys by their industry', () => {
    const salon = demoRow({ id: 'd-2', key: 'salon', industry: 'Beauty', order: 3 });
    const clinic = demoRow({ id: 'd-1', key: 'clinic', industry: 'Healthcare', order: 1 });
    const list = [salon, clinic];
    demos.data = { whatsappDemos: list };
    const { result } = renderHook(() => useIndustries());
    expect(result.current.options).toEqual([
      { key: 'clinic', industry: 'Healthcare' },
      { key: 'salon', industry: 'Beauty' },
    ]);
    expect(result.current.industryName('salon')).toBe('Beauty');
    // A demo removed since the event was recorded keeps its key.
    expect(result.current.industryName('bakery')).toBe('bakery');
    // The query's own array is left as the server sent it.
    expect(list.map((demo) => demo.key)).toEqual(['salon', 'clinic']);
  });

  it('keeps the same lookup while the data does not change', () => {
    demos.data = { whatsappDemos: [demoRow()] };
    const { result, rerender } = renderHook(() => useIndustries());
    const first = result.current.industryName;
    rerender();
    expect(result.current.industryName).toBe(first);
  });
});
