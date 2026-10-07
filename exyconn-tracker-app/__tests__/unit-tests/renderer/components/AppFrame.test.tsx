// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import AppFrame from '../../../../src/renderer/components/AppFrame';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

/** Whether a global rule currently clears the page under the frame. */
function pageCleared(): boolean {
  const css = [...document.querySelectorAll('style')].map((node) => node.textContent).join('');
  return /html,\s?body\{background-color:transparent;?\}/.test(css);
}

describe('AppFrame', () => {
  it('keeps the page painted when the ground is solid', async () => {
    await render(
      <AppFrame>
        <p>screen</p>
      </AppFrame>,
    );
    expect(document.body.textContent).toBe('screen');
    expect(pageCleared()).toBe(false);
  });

  it('clears the page under a see-through ground so the desktop can show', async () => {
    await render(
      <AppFrame groundOpacity={0.6}>
        <p>screen</p>
      </AppFrame>,
    );
    expect(document.body.textContent).toBe('screen');
    expect(pageCleared()).toBe(true);
  });
});
