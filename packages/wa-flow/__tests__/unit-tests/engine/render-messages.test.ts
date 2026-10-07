import { describe, expect, it } from 'vitest';
import { render } from './render-fixtures';
import { NOW } from './fixtures';

describe('renderNode — messages', () => {
  it('renders text and notices translated and filled', () => {
    expect(render({ id: 't', type: 'text', data: { text: 'Hi {{name}}' } })).toEqual([
      { type: 'text', text: '~Hi Asha' },
    ]);
    expect(render({ id: 'n', type: 'notice', data: { text: 'Paid' } })).toEqual([
      { type: 'system', text: '~Paid' },
    ]);
  });

  it('renders buttons with optional header and footer and evaluated sets', () => {
    const [withExtras] = render({
      id: 'b',
      type: 'buttons',
      data: {
        header: 'Head',
        footer: 'Foot',
        text: 'Pick',
        buttons: [
          { id: 'y', title: 'Yes', set: { answer: '{{name}} said yes' } },
          { id: 'n', title: 'No' },
        ],
      },
    });
    expect(withExtras).toEqual({
      type: 'buttons',
      header: '~Head',
      text: '~Pick',
      footer: '~Foot',
      buttons: [
        {
          id: 'y',
          title: '~Yes',
          description: undefined,
          set: { answer: 'Asha said yes' },
          ref: { workflow: 'wf', node: 'b', handle: 'y' },
        },
        {
          id: 'n',
          title: '~No',
          description: undefined,
          set: undefined,
          ref: { workflow: 'wf', node: 'b', handle: 'n' },
        },
      ],
    });
    const [plain] = render({
      id: 'b',
      type: 'buttons',
      data: { text: 'Pick', buttons: [{ id: 'y', title: 'Yes' }] },
    });
    expect(plain).toMatchObject({ header: undefined, footer: undefined });
  });

  it('renders call-to-action buttons, filling data but not translating it', () => {
    const [cta] = render(
      {
        id: 'c',
        type: 'cta',
        data: {
          text: 'Act',
          actions: [
            { kind: 'url', title: 'Open', url: 'https://x.example/{{name}}' },
            { kind: 'call', title: 'Call', phone: '{{phone}}' },
          ],
        },
      },
      { phone: '+91 90000 11111' },
    );
    expect(cta).toMatchObject({
      type: 'cta',
      actions: [
        { kind: 'url', title: '~Open', url: 'https://x.example/Asha' },
        { kind: 'call', title: '~Call', phone: '+91 90000 11111' },
      ],
    });
  });

  it('renders calendar actions with a numeric start and optional location', () => {
    const event = (location?: string) =>
      render(
        {
          id: 'c',
          type: 'cta',
          data: {
            text: 'Save',
            actions: [
              {
                kind: 'calendar',
                title: 'Add',
                event: { title: 'Visit', start: '{{slot}}', durationMin: 30, location },
              },
            ],
          },
        },
        { slot: String(NOW) },
      );
    expect(event('Clinic')[0]).toMatchObject({
      actions: [
        {
          kind: 'calendar',
          title: '~Add',
          event: { title: '~Visit', start: NOW, durationMin: 30, location: '~Clinic' },
        },
      ],
    });
    expect(event()[0]).toMatchObject({ actions: [{ event: { location: undefined } }] });
  });
});

describe('renderNode — prompts, people and logic', () => {
  it('sends an input or AI prompt only when there is one', () => {
    expect(
      render({ id: 'i', type: 'input', data: { var: 'v', kind: 'name', prompt: 'Name?' } }),
    ).toEqual([{ type: 'text', text: '~Name?' }]);
    expect(render({ id: 'i', type: 'input', data: { var: 'v', kind: 'name' } })).toEqual([]);
    expect(render({ id: 'a', type: 'ai', data: { intents: [], entities: [] } })).toEqual([]);
  });

  it('announces a handoff and sends the agent message', () => {
    expect(
      render({ id: 'h', type: 'handoff', data: { text: 'Hello', agentName: 'Rhea' } }),
    ).toEqual([
      { type: 'system', text: '~Rhea joined the conversation' },
      { type: 'text', text: '~Hello', sender: 'Rhea' },
    ]);
  });

  it('sends the end text only when there is one, and nothing for logic nodes', () => {
    expect(render({ id: 'e', type: 'end', data: { text: 'Bye', showMenu: false } })).toEqual([
      { type: 'text', text: '~Bye' },
    ]);
    expect(render({ id: 'e', type: 'end', data: { showMenu: true } })).toEqual([]);
    expect(render({ id: 'd', type: 'delay', data: { ms: 500 } })).toEqual([]);
    expect(render({ id: 'j', type: 'jump', data: { workflowKey: 'x' } })).toEqual([]);
  });
});
