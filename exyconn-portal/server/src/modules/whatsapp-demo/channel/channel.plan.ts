import type { PendingPush } from '@exyconn/wa-flow';
import type { ChatEvent, DemoBundle } from '@exyconn/wa-flow/engine';
import { industryChoice, industryNamed, isSwitchWord } from './channel.industries';
import type { ChatRecord } from './channel.chats';

/** What arrived: typed text, a tapped button or list row (by its id), or a reminder now due. */
export type Input =
  | { kind: 'text'; text: string }
  | { kind: 'reply'; id: string }
  | { kind: 'push'; push: PendingPush };

/** What to do about it. */
export type Plan =
  | { kind: 'picker'; page: number }
  | { kind: 'start'; demoKey: string }
  | { kind: 'engine'; bundle: DemoBundle; event: ChatEvent }
  | { kind: 'ignore' };

/** Typed by the conversation when a tapped option is too old to be remembered. */
const MENU_WORD = 'menu';

function planReply(id: string, chat: ChatRecord, bundle: DemoBundle | undefined): Plan {
  const option = chat.options[id];
  if (!option) {
    return bundle
      ? { kind: 'engine', bundle, event: { type: 'text', text: MENU_WORD } }
      : { kind: 'picker', page: 0 };
  }
  const choice = industryChoice(option);
  if (choice?.kind === 'pick') {
    return { kind: 'start', demoKey: choice.demoKey };
  }
  if (choice?.kind === 'page') {
    return { kind: 'picker', page: choice.page };
  }
  if (!bundle) {
    return { kind: 'picker', page: 0 };
  }
  return { kind: 'engine', bundle, event: { type: 'choice', option, quoted: '' } };
}

function planText(
  text: string,
  bundles: readonly DemoBundle[],
  bundle: DemoBundle | undefined,
): Plan {
  if (isSwitchWord(text)) {
    return { kind: 'picker', page: 0 };
  }
  if (bundle) {
    return { kind: 'engine', bundle, event: { type: 'text', text } };
  }
  const named = industryNamed(bundles, text);
  return named ? { kind: 'start', demoKey: named } : { kind: 'picker', page: 0 };
}

export function plan(input: Input, chat: ChatRecord, bundles: readonly DemoBundle[]): Plan {
  const bundle = bundles.find((b) => b.demo.key === chat.demoKey);
  switch (input.kind) {
    case 'reply':
      return planReply(input.id, chat, bundle);
    case 'text':
      return planText(input.text, bundles, bundle);
    default:
      // A reminder from an industry the chat has since left is dropped, as the browser does.
      return bundle && input.push.demoKey === bundle.demo.key
        ? { kind: 'engine', bundle, event: { type: 'push', push: input.push } }
        : { kind: 'ignore' };
  }
}
