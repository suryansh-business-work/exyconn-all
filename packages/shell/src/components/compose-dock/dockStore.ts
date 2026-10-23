import { useState, useSyncExternalStore, type ComponentType, type ReactNode } from 'react';

/** What a panel's body is handed: the panel itself (its key and data) and how to close it. */
export interface DockBodyProps {
  panel: DockPanel;
  onClose: () => void;
}

/** What a caller hands the dock to open a window. */
export interface DockRequest {
  /** One window per key: opening the same key again brings that window back. */
  key: string;
  /** English source text, translated where it is shown, e.g. "Email". */
  title: string;
  /** Shown after the title as is (a name or an address), e.g. "Email · Ada". */
  subject?: string;
  icon?: ReactNode;
  /** What the window holds; it reads its own data from `panel.data`. */
  Body: ComponentType<DockBodyProps>;
  data?: unknown;
}

/** One window in the dock. Only one is expanded at a time; the others wait as pills. */
export interface DockPanel extends DockRequest {
  minimized: boolean;
  /** Set when the panel was just opened or restored: focus moves into it once. */
  focusPending: boolean;
}

/** Where the expanded panel was dragged to (its top-left corner); null keeps it bottom-right. */
export interface DockPosition {
  x: number;
  y: number;
}

/** The size the expanded panel was resized to; null keeps its default size. */
export interface DockSize {
  width: number;
  height: number;
}

export interface DockState {
  panels: DockPanel[];
  position: DockPosition | null;
  size: DockSize | null;
  /** Fills the screen; the position and size above come back on restore. */
  maximized: boolean;
}

/**
 * The dock lives outside React: a page remounts on every navigation (even a tab change), and a
 * half-written email or a call in progress must survive that. The store keeps the panels; the
 * memory below keeps each panel's draft and status for its next mount.
 */
let state: DockState = { panels: [], position: null, size: null, maximized: false };
const listeners = new Set<() => void>();
const memory = new Map<string, unknown>();

function update(next: DockState) {
  state = next;
  for (const listener of listeners) {
    listener();
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const readState = () => state;

/** The open panels and where the expanded one sits. */
export const useDock = () => useSyncExternalStore(subscribe, readState, readState);

/** Opens (or brings back) a window; any other expanded window becomes a pill. */
export function openDockPanel(request: DockRequest) {
  const others = state.panels
    .filter((panel) => panel.key !== request.key)
    .map((panel) => ({ ...panel, minimized: true, focusPending: false }));
  update({
    ...state,
    panels: [...others, { ...request, minimized: false, focusPending: true }],
  });
}

export function minimizeDockPanel(key: string) {
  update({
    ...state,
    panels: state.panels.map((panel) =>
      panel.key === key ? { ...panel, minimized: true } : panel,
    ),
  });
}

export function restoreDockPanel(key: string) {
  update({
    ...state,
    panels: state.panels.map((panel) => ({
      ...panel,
      minimized: panel.key !== key,
      focusPending: panel.key === key,
    })),
  });
}

/** The panel has taken focus; a later remount (navigation) must not take it again. */
export function dockFocusTaken(key: string) {
  update({
    ...state,
    panels: state.panels.map((panel) =>
      panel.key === key ? { ...panel, focusPending: false } : panel,
    ),
  });
}

/** Closes the window and forgets everything it remembered. */
export function closeDockPanel(key: string) {
  for (const name of memory.keys()) {
    if (name.startsWith(`${key}|`)) {
      memory.delete(name);
    }
  }
  update({ ...state, panels: state.panels.filter((panel) => panel.key !== key) });
}

export function moveDock(position: DockPosition | null) {
  update({ ...state, position });
}

export function resizeDock(size: DockSize | null) {
  update({ ...state, size });
}

export function maximizeDock(maximized: boolean) {
  update({ ...state, maximized });
}

/** A value a panel keeps across remounts until it is closed, e.g. a draft or a call status. */
export function readMemory<T>(panelKey: string, name: string): T | undefined {
  return memory.get(`${panelKey}|${name}`) as T | undefined;
}

export function writeMemory(panelKey: string, name: string, value: unknown) {
  memory.set(`${panelKey}|${name}`, value);
}

/** `useState` that survives the page remounting, for as long as the panel stays open. */
export function useRemembered<T>(panelKey: string, name: string, initial: T) {
  const [value, setValue] = useState<T>(() => readMemory<T>(panelKey, name) ?? initial);
  const set = (next: T) => {
    writeMemory(panelKey, name, next);
    setValue(next);
  };
  return [value, set] as const;
}
