// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ProgressStylePicker from '../../../../src/renderer/components/ProgressStylePicker';
import {
  buttonNamed,
  clickElement,
  installTracker,
  overrideTracker,
  render,
  trackerState,
  unmountAll,
} from '../../test-utils';
import { pageText } from './fixtures';

const setPreferences = vi.fn(() => Promise.resolve());

beforeEach(() => {
  setPreferences.mockClear();
  installTracker(trackerState('idle'));
  overrideTracker({ setPreferences });
});
afterEach(unmountAll);

describe('ProgressStylePicker', () => {
  it('describes the bar and switches to the ring', async () => {
    await render(<ProgressStylePicker style="bar" />);
    expect(buttonNamed('Bar').getAttribute('aria-pressed')).toBe('true');
    expect(pageText()).toContain('drawn as a bar, with what is left as a length.');
    await clickElement(buttonNamed('Ring'));
    expect(setPreferences).toHaveBeenCalledWith({ progressStyle: 'ring' });
  });

  it('describes the ring, and keeps it when the pressed button is pressed again', async () => {
    await render(<ProgressStylePicker style="ring" />);
    expect(pageText()).toContain('drawn as a ring, with the percentage inside it.');
    await clickElement(buttonNamed('Ring'));
    expect(setPreferences).toHaveBeenCalledWith({ progressStyle: 'ring' });
  });
});
