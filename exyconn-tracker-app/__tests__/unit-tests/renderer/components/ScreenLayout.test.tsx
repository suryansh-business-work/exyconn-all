// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import ScreenLayout from '../../../../src/renderer/components/ScreenLayout';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

describe('ScreenLayout', () => {
  it.each([undefined, 720])(
    'puts the screen in the page’s main landmark (max width %s)',
    async (maxWidth) => {
      await render(
        <ScreenLayout maxWidth={maxWidth}>
          <h1>Sign in</h1>
        </ScreenLayout>,
      );
      const main = document.querySelector('main');
      expect(main?.querySelector('h1')?.textContent).toBe('Sign in');
    },
  );
});
