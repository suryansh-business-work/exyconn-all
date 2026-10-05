import type { ChatActions } from '../controller';
import { h, icon, on } from '../dom';
import { icons } from '../icons';
import type { ChatState } from '../store/state';
import { strings } from '../strings';
import type { FaqItem } from '../types';
import type { View } from './view';

function faqEntry(faq: Readonly<FaqItem>): HTMLDetailsElement {
  return h(
    'details',
    { class: 'cw-faq' },
    h('summary', {}, h('span', {}, faq.question), icon(icons.expand)),
    h('p', {}, faq.answer),
  );
}

const matches = (faq: Readonly<FaqItem>, query: string): boolean =>
  faq.question.toLowerCase().includes(query) || faq.answer.toLowerCase().includes(query);

/** The team's FAQs as a searchable accordion; no sign-in needed. */
export function createFaqs(actions: Readonly<ChatActions>): View {
  const search = h('input', {
    id: 'cw-faq-search',
    class: 'cw-input',
    type: 'search',
    placeholder: strings.searchFaqs,
  });
  const list = h('div', { class: 'cw-faq-list' });
  const empty = h('p', { class: 'cw-muted cw-center', role: 'status' });
  const help = h('button', { type: 'button', class: 'cw-button cw-primary' }, strings.chatWithUs);
  on(help, 'click', () => actions.selectTab('LIVE'));
  const el = h(
    'div',
    { class: 'cw-faqs' },
    h(
      'div',
      { class: 'cw-search' },
      h('label', { for: 'cw-faq-search', class: 'cw-sr' }, strings.searchFaqs),
      icon(icons.search),
      search,
    ),
    list,
    empty,
    h('div', { class: 'cw-help' }, h('p', {}, strings.stillNeedHelp), help),
  );

  let faqs: readonly FaqItem[] = [];
  let entries: HTMLDetailsElement[] = [];

  const filter = (): void => {
    const query = search.value.trim().toLowerCase();
    let shown = 0;
    entries.forEach((entry, index) => {
      entry.hidden = !matches(faqs[index], query);
      shown += entry.hidden ? 0 : 1;
    });
    empty.hidden = shown > 0;
    empty.textContent = faqs.length === 0 ? strings.noFaqs : strings.noFaqMatch;
  };
  on(search, 'input', filter);

  return {
    el,
    update(state: Readonly<ChatState>) {
      const next = state.config?.faqs ?? [];
      if (next === faqs) {
        return;
      }
      faqs = next;
      entries = faqs.map(faqEntry);
      list.replaceChildren(...entries);
      filter();
    },
  };
}
