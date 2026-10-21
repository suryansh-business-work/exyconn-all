import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { MemoryRouter, useNavigate, type NavigateFunction } from 'react-router-dom';
import { PwaAutoUpdate } from '@/pwa/PwaAutoUpdate';

const pwa = vi.hoisted(() => ({ ready: false, apply: vi.fn() }));
vi.mock('@/pwa/usePwaUpdate', () => ({ usePwaUpdate: () => pwa }));

let navigate: NavigateFunction = () => undefined;

/** Hands the test the router's navigate, so it can move between pages. */
function Navigator() {
  navigate = useNavigate();
  return null;
}

function tree(path: string) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Navigator />
      <PwaAutoUpdate />
    </MemoryRouter>
  );
}

function renderAt(path: string) {
  return render(tree(path));
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: state });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('PwaAutoUpdate', () => {
  beforeEach(() => {
    pwa.ready = false;
    pwa.apply.mockReset();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });
  afterEach(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  });

  it('renders nothing and applies nothing while no build is waiting', () => {
    const { container } = renderAt('/invoices');

    act(() => navigate('/payroll'));
    setVisibility('hidden');

    expect(container).toBeEmptyDOMElement();
    expect(pwa.apply).not.toHaveBeenCalled();
  });

  it('keeps the current page when a build arrives, then takes it on the next navigation', () => {
    const view = renderAt('/invoices/new');
    pwa.ready = true;
    view.rerender(tree('/invoices/new'));
    expect(pwa.apply).not.toHaveBeenCalled();

    act(() => navigate('/invoices/new?step=2'));
    expect(pwa.apply).not.toHaveBeenCalled();

    act(() => navigate('/payroll'));
    expect(pwa.apply).toHaveBeenCalledTimes(1);
  });

  it('takes a waiting build at once when the tab is already in the background', () => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    pwa.ready = true;

    renderAt('/invoices');

    expect(pwa.apply).toHaveBeenCalledTimes(1);
  });

  it('takes a waiting build when the tab is hidden, not when it comes back', () => {
    pwa.ready = true;
    const { unmount } = renderAt('/invoices');
    expect(pwa.apply).not.toHaveBeenCalled();

    setVisibility('visible');
    expect(pwa.apply).not.toHaveBeenCalled();
    setVisibility('hidden');
    expect(pwa.apply).toHaveBeenCalledTimes(1);

    unmount();
    setVisibility('hidden');
    expect(pwa.apply).toHaveBeenCalledTimes(1);
  });

  it('waits for a navigation even when the build is re-announced on the same page', () => {
    pwa.ready = true;
    const view = renderAt('/invoices/new');
    pwa.ready = false;
    view.rerender(tree('/invoices/new'));
    pwa.ready = true;
    view.rerender(tree('/invoices/new'));
    expect(pwa.apply).not.toHaveBeenCalled();

    act(() => navigate('/payroll'));
    expect(pwa.apply).toHaveBeenCalledTimes(1);
  });
});
