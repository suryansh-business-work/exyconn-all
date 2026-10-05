import type { ChatState } from '../store/state';

/** A piece of the widget: built once, then patched from the state on every change. */
export interface View<E extends HTMLElement = HTMLElement> {
  el: E;
  update(state: Readonly<ChatState>, previous: Readonly<ChatState>): void;
}

/** Ids inside the shadow root, shared by the elements that reference each other. */
export const IDS = {
  panel: 'cw-panel',
  title: 'cw-title',
  menu: 'cw-menu',
  tabpanel: 'cw-tabpanel',
  tab: (tab: string) => `cw-tab-${tab}`,
} as const;
