import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { CatalogWarn } from '@exyconn/wa-flow';
import type { DemoBundle } from '@exyconn/wa-flow/engine';
import { useCatalog } from '../../../src/hooks/useCatalog';

const api = vi.hoisted(() => ({
  result: { data: undefined, loading: false, error: undefined } as Record<string, unknown>,
  options: undefined as unknown,
  refetch: vi.fn(),
  toDemoBundle: vi.fn(),
  warn: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', () => ({
  useWhatsappDemoCatalogQuery: (options: unknown) => {
    api.options = options;
    return { ...api.result, refetch: api.refetch };
  },
}));
vi.mock('@exyconn/wa-flow', () => ({ toDemoBundle: api.toDemoBundle }));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: { warn: api.warn } }));

interface Entry {
  revision: string;
  demo: { key: string };
}

const entry = (key: string, revision: string): Entry => ({ revision, demo: { key } });

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

beforeEach(() => {
  api.result = { data: undefined, loading: false, error: undefined };
  api.refetch.mockReset().mockResolvedValue({});
  api.toDemoBundle
    .mockReset()
    .mockImplementation((e: Entry) =>
      e.demo.key === 'broken'
        ? null
        : ({ demo: { key: e.demo.key }, workflows: [] } as unknown as DemoBundle),
    );
  api.warn.mockReset();
});

afterEach(() => {
  Reflect.deleteProperty(document, 'visibilityState');
});

describe('useCatalog', () => {
  it('asks the server every time, showing what is cached meanwhile', () => {
    renderHook(() => useCatalog());
    expect(api.options).toEqual({ fetchPolicy: 'cache-and-network' });
  });

  it('is loading only while there is nothing to show yet', () => {
    api.result = { data: undefined, loading: true };
    expect(renderHook(() => useCatalog()).result.current.loading).toBe(true);
    api.result = { data: { whatsappDemoCatalog: [] }, loading: true };
    expect(renderHook(() => useCatalog()).result.current.loading).toBe(false);
  });

  it('has no demos before the catalog arrives', () => {
    const { result } = renderHook(() => useCatalog());
    expect(result.current.bundles.size).toBe(0);
  });

  it('keys each published demo by its key with its revision, skipping one that does not parse', () => {
    api.result = {
      data: {
        whatsappDemoCatalog: [entry('clinic', 'r1'), entry('broken', 'r2'), entry('salon', 'r3')],
      },
      loading: false,
    };
    const { result } = renderHook(() => useCatalog());
    expect([...result.current.bundles.keys()]).toEqual(['clinic', 'salon']);
    expect(result.current.bundles.get('salon')).toEqual({
      demo: { key: 'salon' },
      workflows: [],
      revision: 'r3',
    });
  });

  it('logs what the catalog parser warns about', () => {
    api.result = { data: { whatsappDemoCatalog: [entry('clinic', 'r1')] }, loading: false };
    renderHook(() => useCatalog());
    const warn = api.toDemoBundle.mock.calls[0][1] as CatalogWarn;
    const problem = new Error('bad graph');
    warn('wa-demo: workflow did not parse', problem, { demo: 'clinic' });
    expect(api.warn).toHaveBeenCalledWith('wa-demo: workflow did not parse', problem, {
      demo: 'clinic',
    });
  });

  it('re-reads the catalog when the tab comes back into view, not when it is hidden', () => {
    const { unmount } = renderHook(() => useCatalog());
    setVisibility('hidden');
    expect(api.refetch).not.toHaveBeenCalled();
    setVisibility('visible');
    expect(api.refetch).toHaveBeenCalledTimes(1);
    unmount();
    setVisibility('visible');
    expect(api.refetch).toHaveBeenCalledTimes(1);
  });

  it('warns when that refresh fails', async () => {
    const failure = new Error('offline');
    api.refetch.mockRejectedValue(failure);
    renderHook(() => useCatalog());
    setVisibility('visible');
    await vi.waitFor(() => {
      expect(api.warn).toHaveBeenCalledWith('wa-demo: catalog refresh failed', failure);
    });
  });
});
