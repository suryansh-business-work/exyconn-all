// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import SignOutButton from './SignOutButton';
import { trackerState } from '../a11y/tracker-fixture';
import { cleanup, installDomShims, mount } from '../a11y/render-harness';
import {
  buttonNamed,
  deferred,
  errorText,
  finish,
  isLoading,
  overrideTracker,
  press,
} from '../a11y/component-harness';

beforeAll(installDomShims);
afterEach(cleanup);

describe('SignOutButton', () => {
  it('shows the final upload as one while sign-out runs', async () => {
    await mount(<SignOutButton />, trackerState('tracking'));
    const leaving = deferred();
    overrideTracker({ logout: () => leaving.promise });

    await press(buttonNamed('Sign out'));
    expect(isLoading(buttonNamed('Syncing your work…'))).toBe(true);
    await finish(leaving.resolve);
  });

  it('says so when sign-out did not finish, and lets them try again', async () => {
    await mount(<SignOutButton />, trackerState('idle'));
    overrideTracker({ logout: () => Promise.reject(new Error('')) });

    await press(buttonNamed('Sign out'));
    await finish(() => undefined);
    expect(errorText()).toBe('Sign out did not finish. Try again.');
    expect(buttonNamed('Sign out').disabled).toBe(false);
  });
});
