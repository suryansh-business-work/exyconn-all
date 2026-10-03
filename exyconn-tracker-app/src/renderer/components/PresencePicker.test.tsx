// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import PresencePicker from './PresencePicker';
import { trackerState } from '../a11y/tracker-fixture';
import { cleanup, installDomShims, mount } from '../a11y/render-harness';
import {
  choose,
  deferred,
  errorText,
  finish,
  overrideTracker,
  typeInto,
} from '../a11y/component-harness';

beforeAll(installDomShims);
afterEach(cleanup);

const state = trackerState('tracking');

function noteField(): HTMLInputElement {
  return document.querySelector<HTMLInputElement>('input[placeholder="Back at 2"]')!;
}

describe('PresencePicker', () => {
  it('says it is saving, and locks the fields, until the portal has the new status', async () => {
    await mount(<PresencePicker presence={state.presence} timezone="UTC" />, state);
    const saving = deferred();
    overrideTracker({ setPresence: () => saving.promise });

    await choose('My status', 'On lunch');
    expect(document.body.textContent).toContain('Saving…');
    expect(noteField().disabled).toBe(true);

    await finish(saving.resolve);
    expect(document.body.textContent).not.toContain('Saving…');
    expect(noteField().disabled).toBe(false);
  });

  it('puts the note back and says so when the portal refuses it', async () => {
    const presence = { ...state.presence, note: 'At my desk' };
    await mount(<PresencePicker presence={presence} timezone="UTC" />, state);
    overrideTracker({ setPresence: () => Promise.reject(new Error('Offline')) });

    const field = noteField();
    await typeInto(field, 'Back at 2');
    expect(noteField().value).toBe('Back at 2');
    await finish(() => field.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));

    expect(errorText()).toBe('Offline');
    expect(noteField().value).toBe('At my desk');
  });

  it('leaves an unchanged note alone when the field loses focus', async () => {
    await mount(<PresencePicker presence={state.presence} timezone="UTC" />, state);
    const calls: string[] = [];
    overrideTracker({ setPresence: () => Promise.resolve(calls.push('presence')) });
    await finish(() => noteField().dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
    expect(calls).toEqual([]);
  });

  it('says since when an away status was set, and that tracking stays paused', async () => {
    const away = { status: 'LUNCH' as const, note: '', since: '2026-09-14T12:30:00.000Z' };
    await mount(<PresencePicker presence={away} timezone="UTC" />, state);
    expect(document.body.textContent).toMatch(/Since 12:30.*tracking stays paused/);
    cleanup();

    await mount(
      <PresencePicker presence={{ ...away, since: 'not a date' }} timezone="UTC" />,
      state,
    );
    expect(document.body.textContent).toContain(' — tracking stays paused');
  });
});
