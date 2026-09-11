import { describe, expect, it } from 'vitest';
import { signOutMessage } from '../../../src/lib/session/sign-out';

const SIGN_IN_AGAIN = 'You will need your portal email and password to sign in again.';

describe('signOutMessage', () => {
  it('only reminds about signing in again when nothing is open or pending', () => {
    expect(signOutMessage('idle', 0)).toBe(SIGN_IN_AGAIN);
  });

  it('warns that a running session stops', () => {
    expect(signOutMessage('tracking', 0)).toMatch(/^Tracking is running\. Signing out stops it/);
  });

  it('warns that a paused session ends', () => {
    expect(signOutMessage('paused', 0)).toMatch(/^Your paused session ends/);
  });

  it('counts the work still waiting to upload', () => {
    expect(signOutMessage('idle', 1)).toMatch(/^1 item is still waiting to upload/);
    expect(signOutMessage('idle', 3)).toMatch(/^3 items are still waiting to upload/);
  });

  it('puts every warning in its own paragraph, the reminder last', () => {
    const paragraphs = signOutMessage('tracking', 2).split('\n\n');
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[2]).toBe(SIGN_IN_AGAIN);
  });
});
