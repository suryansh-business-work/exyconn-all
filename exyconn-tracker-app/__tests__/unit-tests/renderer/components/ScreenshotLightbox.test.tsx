// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DayScreenshot } from '@shared/types';
import ScreenshotLightbox from '../../../../src/renderer/components/ScreenshotLightbox';
import { button, clickElement, render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

const SHOT: DayScreenshot = {
  id: 'shot-1',
  capturedAt: '2026-09-14T10:30:00.000Z',
  imageUrl: 'data:,',
  blurred: true,
  activityPercent: 40,
};

describe('ScreenshotLightbox', () => {
  it('shows a lone shot with its time, activity and blur, and no paging', async () => {
    const onClose = vi.fn();
    await render(
      <ScreenshotLightbox
        shots={[SHOT]}
        index={0}
        timezone="UTC"
        onClose={onClose}
        onNavigate={vi.fn()}
      />,
    );
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(pageText()).toContain('Mon 14 Sep, 10:30 AM');
    expect(pageText()).toContain('40% active');
    expect(pageText()).toContain('Blurred');
    expect(pageText()).not.toContain('1 / 1');
    expect(() => button('Next')).toThrow();

    await clickElement(button('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores the arrow keys when the index points past an empty day', async () => {
    const onNavigate = vi.fn();
    await render(
      <ScreenshotLightbox
        shots={[]}
        index={0}
        timezone="UTC"
        onClose={vi.fn()}
        onNavigate={onNavigate}
      />,
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await act(async () => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
