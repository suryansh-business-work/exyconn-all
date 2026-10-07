// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import ClosingDialog from '../../../../src/renderer/components/ClosingDialog';
import { render, stubTracker, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

/** Captures the two close listeners the dialog subscribes, so a test can fire them. */
function bridge(): { blocked: (count: number) => void; released: () => void } {
  let blocked: (count: number) => void = () => undefined;
  let released: () => void = () => undefined;
  stubTracker({
    onCloseBlocked: (listener) => {
      blocked = listener;
      return () => undefined;
    },
    onCloseReleased: (listener) => {
      released = listener;
      return () => undefined;
    },
  });
  return {
    blocked: (count) => blocked(count),
    released: () => released(),
  };
}

function dialog(): Element | null {
  return document.querySelector('[role="dialog"]');
}

describe('ClosingDialog', () => {
  it('stays hidden until a close is held back by an upload', async () => {
    bridge();
    await render(<ClosingDialog />);
    expect(dialog()).toBeNull();
  });

  it('says how much is left, then that it is finishing, then gets out of the way', async () => {
    const close = bridge();
    await render(<ClosingDialog />);

    await act(async () => close.blocked(3));
    expect(dialog()?.querySelector('h2')?.textContent).toBe('Upload in progress');
    expect(pageText()).toContain('3 still to upload. Closing now would make this work upload');
    expect(document.querySelector('[role="progressbar"]')?.getAttribute('aria-label')).toBe(
      '3 still to upload',
    );

    await act(async () => close.blocked(0));
    expect(pageText()).toContain('Finishing the upload. Closing now');

    await act(async () => close.released());
    expect(dialog()).toBeNull();
  });
});
