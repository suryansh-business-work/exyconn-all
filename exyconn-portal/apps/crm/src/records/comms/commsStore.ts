import { useState, useSyncExternalStore } from 'react';

export type CommsChannel = 'CALL' | 'SMS' | 'EMAIL';
export type CommsObject = 'CONTACT' | 'COMPANY';

/** A cold email version on its way out: its text, and the version the send is tracked against. */
export interface ColdEmailSend {
  draftId: string;
  variantId: string;
  subject: string;
  body: string;
}

/** What a page hands the dock: the channel, and the record with every number and address. */
export interface CommsRequest {
  channel: CommsChannel;
  object: CommsObject;
  id: string;
  name: string;
  phones: string[];
  emails: string[];
  /** Set when the email is a cold email version, so sending it marks that version sent. */
  coldEmail?: ColdEmailSend;
}

/** One panel in the dock. Only one is expanded at a time; the others wait as pills. */
export interface CommsPanel extends CommsRequest {
  key: string;
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

interface DockState {
  panels: CommsPanel[];
  position: DockPosition | null;
  size: DockSize | null;
  /** Fills the screen; the position and size above come back on restore. */
  maximized: boolean;
}

/**
 * The dock lives outside React: a page remounts on every navigation (even a tab change), and a
 * call in progress or a half-written text must survive that. The store keeps the panels; the
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
export const useCommsDock = () => useSyncExternalStore(subscribe, readState, readState);

/** One panel per record and channel; each cold email version gets its own, with its own draft. */
const keyOf = (request: CommsRequest) =>
  [request.channel, request.object, request.id, request.coldEmail?.variantId]
    .filter(Boolean)
    .join(':');

/** Opens (or brings back) a panel for the record; any other expanded panel becomes a pill. */
export function openComms(request: CommsRequest) {
  const key = keyOf(request);
  const others = state.panels
    .filter((panel) => panel.key !== key)
    .map((panel) => ({ ...panel, minimized: true, focusPending: false }));
  update({
    ...state,
    panels: [...others, { ...request, key, minimized: false, focusPending: true }],
  });
}

/** The record's email panel, addressed to `address` (the one clicked) rather than its first. */
export function composeEmailTo(record: Omit<CommsRequest, 'channel'>, address: string) {
  const others = record.emails.filter((email) => email !== address);
  openComms({ ...record, channel: 'EMAIL', emails: [address, ...others] });
}

export function minimizeComms(key: string) {
  update({
    ...state,
    panels: state.panels.map((panel) =>
      panel.key === key ? { ...panel, minimized: true } : panel,
    ),
  });
}

export function restoreComms(key: string) {
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
export function focusTaken(key: string) {
  update({
    ...state,
    panels: state.panels.map((panel) =>
      panel.key === key ? { ...panel, focusPending: false } : panel,
    ),
  });
}

export function closeComms(key: string) {
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
