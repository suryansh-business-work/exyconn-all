import type { BotContent } from '@exyconn/wa-flow';
import {
  INDUSTRIES,
  industryChoice,
  industryNamed,
  industryPicker,
  isSwitchWord,
} from '../../../../../src/modules/whatsapp-demo/channel/channel.industries';
import { demoBundle, option } from './channel.fixtures';

const t = (source: string) => `[${source}]`;
const bundles = (count: number) =>
  Array.from({ length: count }, (_, i) => demoBundle(`demo-${i}`, `Industry ${i}`));

type ListContent = Extract<BotContent, { type: 'list' }>;
function asList(content: BotContent): ListContent {
  if (content.type !== 'list') {
    throw new Error(`Expected a list, got ${content.type}`);
  }
  return content;
}

describe('isSwitchWord', () => {
  it('recognises the words that bring the picker back, however they are typed', () => {
    expect(isSwitchWord('Industries')).toBe(true);
    expect(isSwitchWord('  SWITCH ')).toBe(true);
    expect(isSwitchWord('change   industry')).toBe(true);
    expect(isSwitchWord('All demos!')).toBe(true);
  });

  it('leaves everything else to the industry', () => {
    expect(isSwitchWord('menu')).toBe(false);
    expect(isSwitchWord('switch on the lights')).toBe(false);
  });
});

describe('industryNamed', () => {
  const list = [demoBundle('healthcare', 'Healthcare'), demoBundle('real-estate', 'Real Estate')];

  it('finds an industry by its key or its name', () => {
    expect(industryNamed(list, 'healthcare')).toBe('healthcare');
    expect(industryNamed(list, '  real estate ')).toBe('real-estate');
    expect(industryNamed(list, 'REAL-ESTATE')).toBe('real-estate');
  });

  it('names nothing for text that is not an industry', () => {
    expect(industryNamed(list, 'hello')).toBeUndefined();
    expect(industryNamed([], 'healthcare')).toBeUndefined();
  });
});

describe('industryChoice', () => {
  it('is null for an option of an ordinary workflow', () => {
    expect(industryChoice(option('book'))).toBeNull();
  });

  it('reads a picked industry', () => {
    const picked = option('x', { workflow: INDUSTRIES, node: 'pick', handle: 'healthcare' });
    expect(industryChoice(picked)).toEqual({ kind: 'pick', demoKey: 'healthcare' });
  });

  it('reads the page a "More industries" row asks for, defaulting to the first', () => {
    const page = (handle: string) => option('more', { workflow: INDUSTRIES, node: 'page', handle });
    expect(industryChoice(page('2'))).toEqual({ kind: 'page', page: 2 });
    expect(industryChoice(page('nonsense'))).toEqual({ kind: 'page', page: 0 });
  });
});

describe('industryPicker', () => {
  it('lists every industry on one page when they fit, without a "More" row', () => {
    const list = asList(industryPicker(bundles(3), 0, t));

    expect(list.button).toBe('[Industries]');
    expect(list.text).toContain('[Pick an industry');
    expect(list.sections).toHaveLength(1);
    expect(list.sections[0].title).toBe('[Industries]');
    expect(list.sections[0].rows).toEqual([
      {
        id: 'demo-0',
        title: 'Industry 0',
        description: 'Industry 0 Co',
        ref: { workflow: INDUSTRIES, node: 'pick', handle: 'demo-0' },
      },
      expect.objectContaining({ id: 'demo-1' }),
      expect.objectContaining({ id: 'demo-2' }),
    ]);
  });

  it('pages nine industries at a time with a row for the next page', () => {
    const rows = asList(industryPicker(bundles(20), 0, t)).sections[0].rows;

    expect(rows).toHaveLength(10);
    expect(rows.slice(0, 9).map((r) => r.id)).toEqual(
      Array.from({ length: 9 }, (_, i) => `demo-${i}`),
    );
    expect(rows[9]).toEqual({
      id: 'more',
      title: '[More industries]',
      description: '[See the next set of businesses]',
      ref: { workflow: INDUSTRIES, node: 'page', handle: '1' },
    });
  });

  it('shows the last page and wraps a page past the end back round', () => {
    const last = asList(industryPicker(bundles(20), 2, t)).sections[0].rows;
    expect(last.map((r) => r.id)).toEqual(['demo-18', 'demo-19', 'more']);
    expect(last[2].ref.handle).toBe('3');

    const wrapped = asList(industryPicker(bundles(20), 3, t)).sections[0].rows;
    expect(wrapped[0].id).toBe('demo-0');
  });

  it('still answers with an empty list when nothing is published', () => {
    expect(asList(industryPicker([], 4, t)).sections[0].rows).toEqual([]);
  });
});
