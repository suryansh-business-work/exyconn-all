// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import CrashFallback from '../../../../src/renderer/components/CrashFallback';
import { LiveAnnouncer } from '../../../../src/renderer/a11y/LiveAnnouncer';
import { button, clickElement, render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

describe('CrashFallback', () => {
  it('says the screen failed, announces why and offers a retry', async () => {
    const onRetry = vi.fn();
    await render(
      <LiveAnnouncer>
        <CrashFallback error={new Error('Cannot read the report')} onRetry={onRetry} />
      </LiveAnnouncer>,
    );
    expect(document.querySelector('h2')?.textContent).toBe('This screen hit a problem');
    expect(document.querySelector('.MuiAlert-message')?.textContent).toBe('Cannot read the report');
    expect(document.querySelector('[aria-live="assertive"]')?.textContent).toBe(
      'Cannot read the report',
    );
    await clickElement(button('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
