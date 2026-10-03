// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DayScreenshot } from '@shared/types';
import ScreenshotLightbox from './ScreenshotLightbox';
import { button, click, render, unmountAll } from '../a11y/component-harness';

afterEach(unmountAll);

const SHOT: DayScreenshot = {
  id: 'shot-1',
  capturedAt: '2026-09-14T10:30:00.000Z',
  imageUrl: 'data:,',
  blurred: false,
  activityPercent: 72,
};

function spinner(): Element | null {
  return document.querySelector('[aria-label="Loading the screenshot"]');
}

describe('ScreenshotLightbox', () => {
  it.each(['load', 'error'])('spins over the full-size image until it %ss', async (outcome) => {
    await render(
      <ScreenshotLightbox
        shots={[SHOT]}
        index={0}
        timezone="UTC"
        onClose={() => undefined}
        onNavigate={() => undefined}
      />,
    );
    expect(spinner()).not.toBeNull();
    const image = document.querySelector('[role="dialog"] img');
    await act(async () => image?.dispatchEvent(new Event(outcome)));
    expect(spinner()).toBeNull();
  });

  it('pages through the day with the arrows and the keys, wrapping at either end', async () => {
    const onNavigate = vi.fn();
    const second = { ...SHOT, id: 'shot-2', blurred: true };
    await render(
      <ScreenshotLightbox
        shots={[SHOT, second]}
        index={0}
        timezone="UTC"
        onClose={() => undefined}
        onNavigate={onNavigate}
      />,
    );
    expect(document.body.textContent).toContain('1 / 2');
    await click(button('Next'));
    await click(button('Previous'));
    await act(async () => {
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });
    expect(onNavigate.mock.calls).toEqual([[1], [1], [1], [1]]);
  });

  it('draws nothing while closed', async () => {
    await render(
      <ScreenshotLightbox
        shots={[]}
        index={null}
        timezone="UTC"
        onClose={() => undefined}
        onNavigate={() => undefined}
      />,
    );
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
