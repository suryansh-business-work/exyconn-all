// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import TitleBar from '../../../../src/renderer/components/TitleBar';
import { button, installTracker, render, trackerState, unmountAll } from '../../test-utils';

beforeEach(() => installTracker(trackerState('idle')));
afterEach(unmountAll);

describe('TitleBar', () => {
  it('names the window and keeps the window controls within reach', async () => {
    await render(<TitleBar title="My screenshots" />);
    const header = document.querySelector('header');
    expect(header?.querySelector('.MuiTypography-caption')?.textContent).toBe('My screenshots');
    expect(button('Minimise')).toBeDefined();
    expect(button('Close')).toBeDefined();
  });

  it('places extra controls before the window buttons', async () => {
    await render(
      <TitleBar
        title="My screenshots"
        actions={
          <button type="button" aria-label="Refresh">
            R
          </button>
        }
      />,
    );
    const labels = [...document.querySelectorAll('header button')].map((node) =>
      node.getAttribute('aria-label'),
    );
    expect(labels).toEqual(['Refresh', 'Minimise', 'Maximise', 'Close']);
  });
});
