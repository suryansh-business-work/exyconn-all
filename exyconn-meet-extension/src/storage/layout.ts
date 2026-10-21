import { createSlot, isRecord, type KeyValueArea } from './area';

/** Where the floating icon sits and how wide the panel is — moved by hand, not on the form. */
export interface PanelLayout {
  /** The icon's top-left corner in viewport CSS pixels; null = the chosen corner's default. */
  iconOffset: { x: number; y: number } | null;
  panelWidth: number;
}

export const PANEL_WIDTH = { min: 300, max: 560, initial: 360 } as const;

export const DEFAULT_LAYOUT: PanelLayout = { iconOffset: null, panelWidth: PANEL_WIDTH.initial };

export const LAYOUT_KEY = 'layout';

/** Keeps a width inside the panel's limits. */
export function clampPanelWidth(width: number): number {
  return Math.min(PANEL_WIDTH.max, Math.max(PANEL_WIDTH.min, Math.round(width)));
}

function parseOffset(raw: unknown): PanelLayout['iconOffset'] {
  if (!isRecord(raw) || typeof raw.x !== 'number' || typeof raw.y !== 'number') {
    return null;
  }
  return { x: raw.x, y: raw.y };
}

export function parseLayout(raw: unknown): PanelLayout {
  if (!isRecord(raw)) {
    return DEFAULT_LAYOUT;
  }
  const width = typeof raw.panelWidth === 'number' ? raw.panelWidth : PANEL_WIDTH.initial;
  return { iconOffset: parseOffset(raw.iconOffset), panelWidth: clampPanelWidth(width) };
}

export function createLayoutStore(area: KeyValueArea) {
  const slot = createSlot(area, LAYOUT_KEY, parseLayout);
  return {
    read: async (): Promise<PanelLayout> => (await slot.read()) ?? DEFAULT_LAYOUT,
    write: (layout: PanelLayout): Promise<void> => slot.write(layout),
  };
}
