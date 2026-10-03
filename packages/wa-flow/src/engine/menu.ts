/** The main menu every demo shares: one list row per published workflow. */
import type { BotContent } from '../messages';
import { say, type Scope } from './template';
import type { DemoBundle, EngineContext } from './types';

/** `ref.workflow` of a main-menu row; its `handle` is the workflow key. */
export const MENU = '$menu';

/** Typed words that always bring the menu back, mid-flow included. */
const MENU_WORDS = new Set([
  'menu',
  'main menu',
  'hi',
  'hello',
  'hey',
  'start',
  'restart',
  'cancel',
  'back',
  'namaste',
  'hii',
]);

const NON_WORD = /[^\p{L}\p{N}\s]/gu;
const SPACES = /\s+/g;

/** Lower case, punctuation off, single spaces — what keywords are matched against. */
export function normalise(text: string): string {
  return ` ${text.toLowerCase().replaceAll(NON_WORD, ' ').replaceAll(SPACES, ' ').trim()} `;
}

export function isMenuWord(text: string): boolean {
  return MENU_WORDS.has(normalise(text).trim());
}

/** The workflow whose keyword the text mentions, as a whole word or phrase. */
export function matchKeywords(bundle: DemoBundle, text: string): string | undefined {
  const haystack = normalise(text);
  return bundle.workflows.find((w) => w.keywords.some((k) => haystack.includes(normalise(k))))?.key;
}

export function menuMessage(bundle: DemoBundle, scope: Scope, ctx: EngineContext): BotContent {
  return {
    type: 'list',
    text: say(bundle.demo.menuText, scope, ctx),
    button: say(bundle.demo.menuButton, scope, ctx),
    footer: ctx.t('Type menu at any time to come back here'),
    sections: [
      {
        id: 'services',
        title: ctx.t('Services'),
        rows: bundle.workflows.map((w) => ({
          id: w.key,
          title: ctx.t(w.name),
          description: ctx.t(w.description),
          ref: { workflow: MENU, node: MENU, handle: w.key },
        })),
      },
    ],
  };
}
