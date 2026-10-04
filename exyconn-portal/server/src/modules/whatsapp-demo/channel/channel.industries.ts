import type { BotContent, RenderedOption } from '@exyconn/wa-flow';
import { normalise, type DemoBundle } from '@exyconn/wa-flow/engine';

/**
 * One number demos every industry, so a chat first picks which business it is talking to.
 * The picker is a WhatsApp list; a list holds ten rows, so it pages, nine industries and a
 * "More industries" row at a time. Its rows are ordinary engine options under the `$industries`
 * workflow, which the conversation answers itself instead of passing to the engine.
 */
export const INDUSTRIES = '$industries';
const PICK = 'pick';
const PAGE = 'page';
const PAGE_SIZE = 9;

/** Typed words that bring the picker back from inside any industry. */
const SWITCH_WORDS = new Set(['industries', 'industry', 'switch', 'change industry', 'all demos']);

export function isSwitchWord(text: string): boolean {
  return SWITCH_WORDS.has(normalise(text).trim());
}

/** The industry a typed word names — its key or its name, as a `wa.me` link might prefill. */
export function industryNamed(bundles: readonly DemoBundle[], text: string): string | undefined {
  const typed = normalise(text).trim();
  return bundles.find(
    (b) => normalise(b.demo.key).trim() === typed || normalise(b.demo.industry).trim() === typed,
  )?.demo.key;
}

export type IndustryChoice = { kind: 'pick'; demoKey: string } | { kind: 'page'; page: number };

/** What a tapped picker row asks for, or null when the option is not the picker's. */
export function industryChoice(option: RenderedOption): IndustryChoice | null {
  if (option.ref.workflow !== INDUSTRIES) {
    return null;
  }
  if (option.ref.node === PAGE) {
    return { kind: 'page', page: Number(option.ref.handle) || 0 };
  }
  return { kind: 'pick', demoKey: option.ref.handle };
}

const pickRow = (bundle: DemoBundle): RenderedOption => ({
  id: bundle.demo.key,
  title: bundle.demo.industry,
  description: bundle.demo.business.name,
  ref: { workflow: INDUSTRIES, node: PICK, handle: bundle.demo.key },
});

export function industryPicker(
  bundles: readonly DemoBundle[],
  page: number,
  t: (source: string) => string,
): BotContent {
  const pages = Math.max(Math.ceil(bundles.length / PAGE_SIZE), 1);
  const current = page % pages;
  const rows = bundles.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).map(pickRow);
  if (pages > 1) {
    rows.push({
      id: 'more',
      title: t('More industries'),
      description: t('See the next set of businesses'),
      ref: { workflow: INDUSTRIES, node: PAGE, handle: String(current + 1) },
    });
  }
  return {
    type: 'list',
    text: t(
      'Pick an industry to try its WhatsApp assistant. Type industries at any time to come back here.',
    ),
    button: t('Industries'),
    sections: [{ id: 'industries', title: t('Industries'), rows }],
  };
}
