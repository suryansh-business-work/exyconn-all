import { act, renderHook } from '@testing-library/react';
import {
  closeDockPanel,
  maximizeDock,
  moveDock,
  resizeDock,
  useDock,
  type DockBodyProps,
  type DockPanel,
  type DockRequest,
} from '@/components/compose-dock';

/** A body that only says whose window it is and closes it. */
export function StubBody({ panel, onClose }: Readonly<DockBodyProps>) {
  return (
    <button type="button" onClick={onClose}>
      Body of {panel.key}
    </button>
  );
}

/** A request for a text to Ada, the way the CRM opens one. */
export function dockRequest(overrides: Partial<DockRequest> = {}): DockRequest {
  return {
    key: 'SMS:CONTACT:c-1',
    title: 'SMS',
    subject: 'Ada Lovelace',
    Body: StubBody,
    data: { id: 'c-1' },
    ...overrides,
  };
}

/** Keys of panels built here: their memory (drafts, call status) is forgotten on reset. */
const builtKeys = new Set<string>();

/** A panel as the store holds it, expanded and with focus already taken. */
export function dockPanel(overrides: Partial<DockPanel> = {}): DockPanel {
  const panel = { ...dockRequest(overrides), minimized: false, focusPending: false, ...overrides };
  builtKeys.add(panel.key);
  return panel;
}

/**
 * The dock store is module state: close every open panel, forget the memory of those and of
 * every panel built by {@link dockPanel}, and re-dock it.
 */
export function resetDock(): void {
  const { result, unmount } = renderHook(() => useDock());
  act(() => {
    const keys = new Set([...builtKeys, ...result.current.panels.map((panel) => panel.key)]);
    for (const key of keys) {
      closeDockPanel(key);
    }
    moveDock(null);
    resizeDock(null);
    maximizeDock(false);
  });
  unmount();
}
