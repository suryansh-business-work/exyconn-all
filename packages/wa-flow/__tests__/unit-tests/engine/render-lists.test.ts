import { describe, expect, it } from 'vitest';
import type { BotContent } from '../../../src/messages';
import { render } from './render-fixtures';

const DAY = 24 * 60 * 60 * 1000;
const sections = [
  { id: 's', title: 'More', rows: [{ id: 'r', title: 'Row', description: 'Desc' }] },
];

function asList(content: BotContent) {
  if (content.type !== 'list') {
    throw new Error('expected a list');
  }
  return content;
}

describe('renderNode — lists', () => {
  it('renders a static list with row descriptions', () => {
    const list = asList(
      render({ id: 'l', type: 'list', data: { text: 'Go', button: 'Open', sections } })[0],
    );
    expect(list.sections).toEqual([
      {
        id: 's',
        title: '~More',
        rows: [
          {
            id: 'r',
            title: '~Row',
            description: '~Desc',
            set: undefined,
            ref: { workflow: 'wf', node: 'l', handle: 'r' },
          },
        ],
      },
    ]);
    expect(list).toMatchObject({ text: '~Go', button: '~Open', header: undefined });
  });

  it('puts generated days first, under the button title', () => {
    const list = asList(
      render({
        id: 'l',
        type: 'list',
        data: {
          text: 'Day?',
          button: 'Days',
          sections,
          dynamic: { kind: 'days', count: 2, var: 'day' },
        },
      })[0],
    );
    const tomorrow = Date.UTC(2026, 9, 8);
    expect(list.sections.map((s) => s.id)).toEqual(['generated', 's']);
    expect(list.sections[0].title).toBe('~Days');
    expect(list.sections[0].rows[0]).toEqual({
      id: `day-${tomorrow}`,
      title: `day:${tomorrow}`,
      set: { day: String(tomorrow), dayLabel: `day:${tomorrow}` },
      ref: { workflow: 'wf', node: 'l', handle: 'pick' },
    });
  });

  it('generates slots on the chosen day, and none on a day already over', () => {
    const slots = (day: number) =>
      asList(
        render(
          {
            id: 'l',
            type: 'list',
            data: {
              text: 'Time?',
              button: 'Times',
              sections,
              dynamic: {
                kind: 'slots',
                dayVar: 'day',
                from: 9,
                to: 12,
                stepMin: 30,
                take: 3,
                var: 'slot',
              },
            },
          },
          { day: String(day) },
        )[0],
      );
    const next = slots(Date.UTC(2026, 9, 8)).sections[0];
    expect(next.id).toBe('generated');
    expect(next.rows.length).toBeGreaterThan(0);
    expect(next.rows[0].title).toMatch(/^time:/);
    expect(next.rows[0].set).toHaveProperty('slotLabel');
    expect(slots(Date.UTC(2026, 9, 7) - DAY).sections.map((s) => s.id)).toEqual(['s']);
  });
});
