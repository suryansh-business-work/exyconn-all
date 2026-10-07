// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import GradientBar from '../../../../src/renderer/components/GradientBar';
import { render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

function bar(): Element | null {
  return document.querySelector('[role="progressbar"]');
}

describe('GradientBar', () => {
  it('leaves the inside label out of a fill too short to hold it', async () => {
    await render(<GradientBar percent={10} label="Worked" trailing="of 8h 0m" ariaLabel="10%" />);
    expect(bar()?.getAttribute('aria-valuenow')).toBe('10');
    expect(bar()?.getAttribute('aria-label')).toBe('10%');
    expect(pageText()).toBe('of 8h 0m');
  });

  it('writes the label inside a long enough fill, and clamps past the end', async () => {
    await render(<GradientBar percent={140} label="Worked" trailing="of 8h 0m" ariaLabel="full" />);
    expect(bar()?.getAttribute('aria-valuenow')).toBe('100');
    expect(pageText()).toBe('Workedof 8h 0m');
  });

  it('clamps a negative figure to an empty track', async () => {
    await render(<GradientBar percent={-5} label="Worked" trailing="of 8h 0m" ariaLabel="none" />);
    expect(bar()?.getAttribute('aria-valuenow')).toBe('0');
    expect(bar()?.getAttribute('aria-valuemin')).toBe('0');
    expect(bar()?.getAttribute('aria-valuemax')).toBe('100');
  });
});
