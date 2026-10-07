import { describe, expect, it } from 'vitest';
import { newChatState, respond } from '../../../src/engine/engine';
import { MENU } from '../../../src/engine/menu';
import type { BotContent, ChatMessage, ChatState, RenderedOption } from '../../../src/messages';
import { makeBundle, makeCtx, makeWorkflow } from './fixtures';

const ctx = makeCtx();
const booking = makeWorkflow('book', [
  {
    id: 'hello',
    type: 'text',
    data: { text: 'Booking for {{user.firstName}}', set: { ref: '$id:BK' } },
    next: 'wait',
  },
  { id: 'wait', type: 'delay', data: { ms: 1000 }, next: 'ask' },
  {
    id: 'ask',
    type: 'buttons',
    data: {
      text: 'Confirm {{ref}}?',
      buttons: [
        { id: 'yes', title: 'Yes', set: { answer: 'yes' } },
        { id: 'no', title: 'No' },
        { id: 'lost', title: 'Lost' },
      ],
    },
    next: { yes: 'done', no: 'bye' },
  },
  { id: 'done', type: 'notice', data: { text: 'Booked', complete: true }, next: 'bye' },
  { id: 'bye', type: 'end', data: { text: 'Bye', showMenu: true } },
]);
const other = makeWorkflow('other', [
  {
    id: 'o1',
    type: 'buttons',
    data: { text: 'Other', buttons: [{ id: 'go', title: 'Go' }] },
    next: { go: 'o2' },
  },
  { id: 'o2', type: 'end', data: { showMenu: false } },
]);
const bundle = makeBundle([booking, other]);
const contents = (r: { replies: { message: { content: unknown } }[] }) =>
  r.replies.map((m) => m.message.content as BotContent);
const fresh = (): ChatState => newChatState('demo', 'asha');
const menuOption = (handle: string): RenderedOption => ({
  id: handle,
  title: handle,
  ref: { workflow: MENU, node: MENU, handle },
});

function buttonsOf(content: ChatMessage['content'] | undefined): RenderedOption[] {
  if (content?.type !== 'buttons') {
    throw new Error('expected buttons');
  }
  return content.buttons;
}

describe('respond — choices', () => {
  it('starts a workflow from the menu and plays until it waits', () => {
    const result = respond(
      bundle,
      fresh(),
      { type: 'choice', option: menuOption('book'), quoted: 'Menu' },
      ctx,
    );
    expect(result.sent).toMatchObject({
      from: 'user',
      status: 'sent',
      content: { type: 'reply', text: 'book', quoted: 'Menu' },
    });
    expect(result.signals).toEqual([
      { type: 'STEP', workflow: MENU, node: MENU, stepKind: 'choice', label: 'book' },
      { type: 'FLOW_STARTED', workflow: 'book', node: 'hello' },
    ]);
    const [hello, ask] = result.replies;
    expect(hello.message.content).toEqual({ type: 'text', text: 'Booking for Asha' });
    expect(ask.typingMs).toBe(1100 + 1000);
    expect(result.state.vars.ref).toMatch(/^BK-/);
    expect(buttonsOf(ask.message.content)[0].title).toBe('Yes');
    expect(result.state.workflow).toBe('book');
  });

  it('follows a button, sets its variables and completes once', () => {
    const started = respond(
      bundle,
      fresh(),
      { type: 'choice', option: menuOption('book'), quoted: 'Menu' },
      ctx,
    );
    const yes = buttonsOf(started.replies[1].message.content)[0];
    const result = respond(
      bundle,
      started.state,
      { type: 'choice', option: yes, quoted: 'Confirm' },
      ctx,
    );
    expect(result.state.vars.answer).toBe('yes');
    expect(contents(result).map((c) => c.type)).toEqual(['system', 'text', 'list']);
    expect(result.signals.filter((s) => s.type === 'FLOW_COMPLETED')).toEqual([
      { type: 'FLOW_COMPLETED', workflow: 'book', node: 'done' },
    ]);
    expect(result.state.completed).toBe(true);
  });

  it('shows the menu again for an option that leads nowhere', () => {
    const started = respond(
      bundle,
      fresh(),
      { type: 'choice', option: menuOption('book'), quoted: 'Menu' },
      ctx,
    );
    const lost = buttonsOf(started.replies[1].message.content)[2];
    const result = respond(
      bundle,
      started.state,
      { type: 'choice', option: lost, quoted: 'Confirm' },
      ctx,
    );
    expect(contents(result)[0]).toEqual({
      type: 'text',
      text: 'That option is no longer available. Here is the menu again.',
    });
    const gone = { ...lost, ref: { ...lost.ref, workflow: 'deleted' } };
    expect(
      contents(
        respond(bundle, started.state, { type: 'choice', option: gone, quoted: 'x' }, ctx),
      )[1].type,
    ).toBe('list');
    const missingMenu = respond(
      bundle,
      fresh(),
      { type: 'choice', option: menuOption('nope'), quoted: 'x' },
      ctx,
    );
    expect(missingMenu.signals.some((s) => s.type === 'FLOW_STARTED')).toBe(false);
  });

  it('abandons the open workflow when an option from another one is tapped', () => {
    const started = respond(
      bundle,
      fresh(),
      { type: 'choice', option: menuOption('book'), quoted: 'Menu' },
      ctx,
    );
    const go: RenderedOption = {
      id: 'go',
      title: 'Go',
      ref: { workflow: 'other', node: 'o1', handle: 'go' },
    };
    const result = respond(
      bundle,
      started.state,
      { type: 'choice', option: go, quoted: 'Other' },
      ctx,
    );
    expect(result.signals).toEqual([
      { type: 'STEP', workflow: 'other', node: 'o1', stepKind: 'choice', label: 'Go' },
      { type: 'FLOW_ABANDONED', workflow: 'book', node: '' },
      { type: 'FLOW_STARTED', workflow: 'other', node: 'o1' },
      { type: 'FLOW_COMPLETED', workflow: 'other', node: 'o2' },
    ]);
    expect(result.replies).toEqual([]);
  });

  it('does not report a completed workflow as abandoned', () => {
    const done: ChatState = { ...fresh(), workflow: 'book', completed: true };
    const result = respond(
      bundle,
      done,
      { type: 'choice', option: menuOption('other'), quoted: 'Menu' },
      ctx,
    );
    expect(result.signals.map((s) => s.type)).toEqual(['STEP', 'FLOW_STARTED']);
  });
});
