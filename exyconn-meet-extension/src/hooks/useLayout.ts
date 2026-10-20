import { createLayoutStore, LAYOUT_KEY, parseLayout, type PanelLayout } from '../storage/layout';
import type { KeyValueArea } from '../storage/area';
import { useStoredValue } from './useStoredValue';

const readLayout = (area: KeyValueArea): Promise<PanelLayout> => createLayoutStore(area).read();

/** Where the floating icon sits and the panel's width, live. */
export function useLayout(): PanelLayout | null {
  return useStoredValue(LAYOUT_KEY, parseLayout, readLayout).value;
}

/** Persists a moved icon or resized panel. */
export function saveLayout(layout: PanelLayout): Promise<void> {
  return createLayoutStore(chrome.storage.sync).write(layout);
}
