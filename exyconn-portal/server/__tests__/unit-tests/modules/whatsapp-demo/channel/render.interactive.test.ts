import { LIMITS, type BotContent, type RenderedOption } from '@exyconn/wa-flow';
import {
  clip,
  interactive,
  oneButton,
} from '../../../../../src/modules/whatsapp-demo/channel/render.interactive';
import { option } from './channel.fixtures';

const register = jest.fn((o: RenderedOption) => `id-${o.id}`);
const options = (count: number, prefix = 'opt') =>
  Array.from({ length: count }, (_, i) => option(`${prefix}${i}`));

type List = Extract<BotContent, { type: 'list' }>;
interface Page {
  interactive: {
    header?: unknown;
    footer?: unknown;
    action: {
      button: string;
      sections: { title: string; rows: { id: string; description?: string }[] }[];
    };
  };
}
const pages = (payloads: unknown[]) => payloads as Page[];
const rowIds = (page: Page) =>
  page.interactive.action.sections.flatMap((s) => s.rows.map((r) => r.id));

describe('clip', () => {
  it('leaves text within the limit alone', () => {
    expect(clip('short', 5)).toBe('short');
  });

  it('cuts longer text to the limit, ending in an ellipsis', () => {
    expect(clip('abcdefgh', 5)).toBe('abcd…');
    expect(clip('abcdefgh', 5)).toHaveLength(5);
  });
});

describe('interactive.buttons', () => {
  it('sends up to three options as reply buttons under their registered ids', () => {
    const [payload] = interactive.buttons(
      {
        type: 'buttons',
        header: 'Welcome',
        text: 'Pick one',
        footer: 'Reply any time',
        buttons: options(3),
      },
      register,
      'More',
    );

    expect(register).toHaveBeenCalledTimes(3);
    expect(payload).toEqual({
      type: 'interactive',
      interactive: {
        type: 'button',
        header: { type: 'text', text: 'Welcome' },
        body: { text: 'Pick one' },
        footer: { text: 'Reply any time' },
        action: {
          buttons: [0, 1, 2].map((i) => ({
            type: 'reply',
            reply: { id: `id-opt${i}`, title: `opt${i}` },
          })),
        },
      },
    });
  });

  it('leaves out an absent header and footer, and clips long titles and bodies', () => {
    const long = option('x', {}, 'A button title far too long for WhatsApp');
    const [payload] = interactive.buttons(
      { type: 'buttons', text: 'b'.repeat(1100), buttons: [long] },
      register,
      'More',
    );
    const body = payload.interactive as Record<string, unknown>;

    expect(body.header).toBeUndefined();
    expect(body.footer).toBeUndefined();
    expect((body.body as { text: string }).text).toHaveLength(1024);
    const { buttons } = body.action as { buttons: { reply: { title: string } }[] };
    expect(buttons[0].reply.title).toHaveLength(LIMITS.buttonTitle);
  });

  it('turns more than three options into a list under the given button', () => {
    const [payload] = pages(
      interactive.buttons({ type: 'buttons', text: 'Pick', buttons: options(5) }, register, 'More'),
    );

    expect(payload.interactive.action.button).toBe('More');
    expect(payload.interactive.action.sections).toEqual([
      { title: 'More', rows: [0, 1, 2, 3, 4].map((i) => ({ id: `id-opt${i}`, title: `opt${i}` })) },
    ]);
  });
});

describe('interactive.list', () => {
  const list = (sections: List['sections'], extra: Partial<List> = {}): List => ({
    type: 'list',
    text: 'Choose',
    button: 'Open',
    sections,
    ...extra,
  });

  it('keeps a row description, clipped to its limit', () => {
    const described = { ...option('a'), description: 'd'.repeat(100) };
    const [payload] = interactive.list(
      list([{ id: 's', title: 'S', rows: [described] }]),
      register,
    );
    const { sections } = (payload.interactive as Page['interactive']).action;

    expect(sections[0].rows[0].description).toHaveLength(LIMITS.rowDescription);
  });

  it('cuts a long section into messages of ten rows, the header on the first only', () => {
    const result = pages(
      interactive.list(
        list([{ id: 's', title: 'Days', rows: options(12) }], { header: 'Book', footer: 'Foot' }),
        register,
      ),
    );

    expect(result).toHaveLength(2);
    expect(rowIds(result[0])).toHaveLength(10);
    expect(rowIds(result[1])).toEqual(['id-opt10', 'id-opt11']);
    expect(result[0].interactive.header).toEqual({ type: 'text', text: 'Book' });
    expect(result[1].interactive.header).toBeUndefined();
    expect(result[1].interactive.footer).toEqual({ text: 'Foot' });
    expect(result[1].interactive.action.sections.map((s) => s.title)).toEqual(['Days']);
  });

  it('carries a section over the page break under its own title', () => {
    const result = pages(
      interactive.list(
        list([
          { id: 'a', title: 'Morning', rows: options(9, 'm') },
          { id: 'b', title: 'Evening', rows: options(3, 'e') },
        ]),
        register,
      ),
    );

    expect(result[0].interactive.action.sections.map((s) => [s.title, s.rows.length])).toEqual([
      ['Morning', 9],
      ['Evening', 1],
    ]);
    expect(result[1].interactive.action.sections.map((s) => [s.title, s.rows.length])).toEqual([
      ['Evening', 2],
    ]);
  });

  it('keeps two sections apart even when they share a title', () => {
    const [payload] = pages(
      interactive.list(
        list([
          { id: 'a', title: 'Slots', rows: options(2, 'a') },
          { id: 'b', title: 'Slots', rows: options(2, 'b') },
        ]),
        register,
      ),
    );

    expect(payload.interactive.action.sections.map((s) => s.rows.length)).toEqual([2, 2]);
  });

  it('sends nothing for a list without rows', () => {
    expect(interactive.list(list([{ id: 's', title: 'Empty', rows: [] }]), register)).toEqual([]);
  });
});

describe('oneButton', () => {
  it('offers a single option under a card as one reply button', () => {
    const payload = oneButton('Card text', option('buy', {}, 'Buy now'), register);

    expect(payload).toEqual({
      type: 'interactive',
      interactive: {
        type: 'button',
        header: undefined,
        body: { text: 'Card text' },
        footer: undefined,
        action: { buttons: [{ type: 'reply', reply: { id: 'id-buy', title: 'Buy now' } }] },
      },
    });
  });
});
