import type { ChatActions } from '../controller';
import { h, on, setAttr } from '../dom';
import type { ChatState, Tab } from '../store/state';
import { strings } from '../strings';
import { IDS, type View } from './view';

const TABS: readonly { tab: Tab; label: string }[] = [
  { tab: 'LIVE', label: strings.tabLive },
  { tab: 'KNOWLEDGE', label: strings.tabKnowledge },
  { tab: 'FAQS', label: strings.tabFaqs },
];

/** Where the arrow keys, Home and End move focus to from tab `index`. */
function targetIndex(key: string, index: number): number | null {
  const last = TABS.length - 1;
  const moves: Readonly<Record<string, number>> = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  };
  return moves[key] ?? null;
}

export interface TabsView extends View {
  focusActive(): void;
}

/** The three sections, as an ARIA tablist with roving focus and arrow-key navigation. */
export function createTabs(actions: Readonly<ChatActions>): TabsView {
  const buttons = TABS.map(({ tab, label }) =>
    h(
      'button',
      {
        type: 'button',
        role: 'tab',
        id: IDS.tab(tab),
        class: 'cw-tab',
        'aria-controls': IDS.tabpanel,
        'aria-selected': 'false',
        tabindex: -1,
      },
      label,
    ),
  );
  buttons.forEach((button, index) => {
    on(button, 'click', () => actions.selectTab(TABS[index].tab));
    on(button, 'keydown', (event) => {
      const next = targetIndex(event.key, index);
      if (next === null) {
        return;
      }
      event.preventDefault();
      actions.selectTab(TABS[next].tab);
      buttons[next].focus();
    });
  });
  const el = h('div', { role: 'tablist', class: 'cw-tabs', 'aria-label': strings.tabsLabel });
  el.append(...buttons);

  return {
    el,
    focusActive() {
      buttons.find((button) => button.getAttribute('aria-selected') === 'true')?.focus();
    },
    update(state: Readonly<ChatState>) {
      buttons.forEach((button, index) => {
        const selected = TABS[index].tab === state.tab;
        setAttr(button, 'aria-selected', String(selected));
        setAttr(button, 'tabindex', selected ? 0 : -1);
      });
    },
  };
}
