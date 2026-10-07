import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  document.title = '';
});

async function loadHook() {
  vi.resetModules();
  return (await import('@/components/layout/usePageTitle')).usePageTitle;
}

describe('usePageTitle', () => {
  it('puts the page heading before the app name index.html shipped', async () => {
    document.title = 'HR · Exyconn Track';
    const usePageTitle = await loadHook();

    const { rerender } = renderHook(({ heading }) => usePageTitle(heading), {
      initialProps: { heading: 'Employees' },
    });
    expect(document.title).toBe('Employees · HR · Exyconn Track');

    rerender({ heading: 'Payroll' });
    expect(document.title).toBe('Payroll · HR · Exyconn Track');
  });

  it('uses the heading alone when the page shipped without a title', async () => {
    document.title = '';
    const usePageTitle = await loadHook();

    renderHook(() => usePageTitle('Dashboard'));

    expect(document.title).toBe('Dashboard');
  });

  it('reads no app name when loaded where there is no document', async () => {
    const realDocument = globalThis.document;
    vi.stubGlobal('document', undefined);
    const usePageTitle = await loadHook();
    vi.stubGlobal('document', realDocument);

    renderHook(() => usePageTitle('Offline'));

    expect(document.title).toBe('Offline');
  });
});
