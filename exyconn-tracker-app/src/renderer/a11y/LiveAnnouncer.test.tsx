// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { LiveAnnouncer } from './LiveAnnouncer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('live regions', () => {
  it('stay a single pixel, so they never add a window scrollbar', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(<LiveAnnouncer>content</LiveAnnouncer>);
    });

    const regions = [...document.querySelectorAll('[aria-live]')];
    expect(regions).toHaveLength(2);
    for (const region of regions) {
      const style = getComputedStyle(region);
      expect([style.width, style.height, style.margin]).toEqual(['1px', '1px', '-1px']);
    }
    await act(async () => {
      root.unmount();
    });
  });
});
