// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import ShotImage from './ShotImage';
import { render, unmountAll } from '../a11y/component-harness';

afterEach(unmountAll);

function image(): HTMLImageElement {
  const node = document.querySelector('img');
  if (node === null) {
    throw new Error('No image');
  }
  return node;
}

function skeleton(): Element | null {
  return document.querySelector('.MuiSkeleton-root');
}

describe('ShotImage', () => {
  it('holds a skeleton over the frame until the image has arrived', async () => {
    await render(<ShotImage src="data:," alt="Screenshot captured at 10:30" />);
    expect(skeleton()).not.toBeNull();
    await act(async () => image().dispatchEvent(new Event('load')));
    expect(skeleton()).toBeNull();
    expect(document.body.textContent).not.toContain('could not be loaded');
  });

  it('says so when the image never arrives', async () => {
    await render(<ShotImage src="data:," alt="Screenshot captured at 10:30" />);
    await act(async () => image().dispatchEvent(new Event('error')));
    expect(skeleton()).toBeNull();
    expect(document.body.textContent).toContain('This screenshot could not be loaded.');
  });
});
