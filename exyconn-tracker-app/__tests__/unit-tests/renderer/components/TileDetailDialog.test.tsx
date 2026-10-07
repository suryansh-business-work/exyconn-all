// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import TileDetailDialog from '../../../../src/renderer/components/TileDetailDialog';
import { totalTiles } from '../../../../src/renderer/tiles';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

describe('TileDetailDialog', () => {
  it('draws nothing while no tile is open', async () => {
    await render(<TileDetailDialog tile={null} onClose={vi.fn()} />);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('states the number, the figures around it and the rule behind it', async () => {
    const [worked] = totalTiles({
      activeMs: 7_200_000,
      idleMs: 1_800_000,
      screenshots: 12,
      sessions: 3,
    });
    await render(<TileDetailDialog tile={worked} onClose={vi.fn()} />);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog?.querySelector('h2')?.textContent).toBe('Total worked');
    expect(dialog?.textContent).toContain('2h 0m');
    expect(dialog?.textContent).toContain('Active share80%');
    expect(dialog?.textContent).toContain('Across3 sessions');
    expect(dialog?.querySelector('.MuiAlert-message')?.textContent).toBe(worked.detail.note);
  });
});
