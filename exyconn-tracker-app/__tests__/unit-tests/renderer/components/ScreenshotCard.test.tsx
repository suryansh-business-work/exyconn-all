// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DayScreenshot } from '@shared/types';
import ScreenshotCard from '../../../../src/renderer/components/ScreenshotCard';
import { button, clickElement, render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

const SHOT: DayScreenshot = {
  id: 'shot-1',
  capturedAt: '2026-09-14T10:30:00.000Z',
  imageUrl: 'data:,',
  blurred: false,
  activityPercent: 82,
};

describe('ScreenshotCard', () => {
  it('shows when the shot was taken and how active its interval was, and opens it', async () => {
    const onOpen = vi.fn();
    await render(<ScreenshotCard shot={SHOT} timezone="UTC" onOpen={onOpen} />);
    expect(pageText()).toContain('Mon 14 Sep, 10:30 AM');
    expect(document.querySelector('.MuiChip-colorSuccess')?.textContent).toBe('82% active');
    expect(document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe(
      '82',
    );
    expect(document.querySelector('img')?.getAttribute('alt')).toBe(
      'Screenshot captured at Mon 14 Sep, 10:30 AM',
    );
    expect(
      document.querySelector('[aria-label="Blurred by your workspace\'s settings"]'),
    ).toBeNull();

    await clickElement(button('Open the screenshot captured at Mon 14 Sep, 10:30 AM full screen'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('says when the workspace blurred the shot, and reads a quiet interval in amber', async () => {
    await render(
      <ScreenshotCard
        shot={{ ...SHOT, blurred: true, activityPercent: 12 }}
        timezone="UTC"
        onOpen={vi.fn()}
      />,
    );
    const blur = document.querySelector('svg title');
    expect(blur?.textContent).toBe("Blurred by your workspace's settings");
    expect(document.querySelector('.MuiChip-colorWarning')?.textContent).toBe('12% active');
  });
});
