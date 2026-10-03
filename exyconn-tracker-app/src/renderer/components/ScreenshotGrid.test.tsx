// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DayScreenshot } from '@shared/types';
import ScreenshotGrid from './ScreenshotGrid';
import { click, render, unmountAll } from '../a11y/component-harness';

afterEach(unmountAll);

const SHOT: DayScreenshot = {
  id: 'shot-1',
  capturedAt: '2026-09-14T10:30:00.000Z',
  imageUrl: 'data:,',
  blurred: false,
  activityPercent: 72,
};

describe('ScreenshotGrid', () => {
  it('says so on a day with no screenshots', async () => {
    await render(<ScreenshotGrid shots={[]} timezone="UTC" onOpen={vi.fn()} />);
    expect(document.body.textContent).toContain('No screenshots on this day.');
  });

  it('loads each thumbnail behind a skeleton, and opens the gallery from any of them', async () => {
    const onOpen = vi.fn();
    await render(<ScreenshotGrid shots={[SHOT]} timezone="UTC" onOpen={onOpen} />);
    expect(document.querySelector('.MuiSkeleton-root')).not.toBeNull();
    const thumb = document.querySelector<HTMLElement>('button');
    if (thumb === null) {
      throw new Error('No thumbnail');
    }
    await click(thumb);
    expect(onOpen).toHaveBeenCalled();
  });
});
