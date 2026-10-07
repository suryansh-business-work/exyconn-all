// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import ProgressRing from '../../../../src/renderer/components/ProgressRing';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

function ring(): Element | null {
  return document.querySelector('[role="img"]');
}

describe('ProgressRing', () => {
  it('speaks the figure and its caption as one picture', async () => {
    await render(<ProgressRing value={62} label="62%" caption="4h 58m" color="primary" />);
    expect(ring()?.getAttribute('aria-label')).toBe('62%. 4h 58m');
    expect(ring()?.textContent).toBe('62%4h 58m');
    const arc = document.querySelectorAll('[role="progressbar"]')[1];
    expect(arc?.getAttribute('aria-valuenow')).toBe('62');
  });

  it('draws the arc over a full track, so the fill reads against something', async () => {
    await render(<ProgressRing value={20} label="20%" color="success" size={80} />);
    const [track, arc] = document.querySelectorAll('[role="progressbar"]');
    expect(track.getAttribute('aria-valuenow')).toBe('100');
    expect(arc.getAttribute('aria-valuenow')).toBe('20');
    expect(arc.className).toContain('MuiCircularProgress-colorSuccess');
  });

  it.each([undefined, ''])(
    'says only the figure when there is no caption (%j)',
    async (caption) => {
      await render(<ProgressRing value={50} label="50%" caption={caption} color="primary" />);
      expect(ring()?.getAttribute('aria-label')).toBe('50%');
      expect(ring()?.textContent).toBe('50%');
    },
  );
});
