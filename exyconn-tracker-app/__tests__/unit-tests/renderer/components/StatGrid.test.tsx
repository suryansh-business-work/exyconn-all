// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import HistoryOutlined from '@mui/icons-material/HistoryOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import type { Tile } from '../../../../src/renderer/tiles';
import StatGrid from '../../../../src/renderer/components/StatGrid';
import { button, clickElement, render, rerender, unmountAll } from '../../test-utils';

afterEach(unmountAll);

function tiles(worked: string): Tile[] {
  return [
    {
      id: 'worked',
      label: 'Total worked',
      value: worked,
      icon: HistoryOutlined,
      detail: {
        headline: worked,
        facts: [{ id: 'share', label: 'Active share', value: '86%' }],
        note: 'Every session on every device you have ever tracked on.',
      },
    },
    {
      id: 'sessions',
      label: 'Sessions',
      value: '4',
      icon: PlayCircleOutlined,
      detail: { headline: '4 sessions', facts: [], note: 'One run of tracking.' },
    },
  ];
}

function dialog(): HTMLElement | null {
  return document.querySelector('[role="dialog"]');
}

describe('StatGrid', () => {
  it('lays out one tile per figure, each naming itself as openable', async () => {
    await render(<StatGrid tiles={tiles('2h 0m')} />);
    expect(button('Total worked: 2h 0m. Open details')).toBeDefined();
    expect(button('Sessions: 4. Open details')).toBeDefined();
    expect(dialog()).toBeNull();
  });

  it('explains a tile on click, keeps the open detail live, and closes it', async () => {
    await render(<StatGrid tiles={tiles('2h 0m')} />);
    await clickElement(button('Total worked: 2h 0m. Open details'));
    expect(dialog()?.querySelector('h2')?.textContent).toBe('Total worked');
    expect(dialog()?.textContent).toContain('Active share86%');
    expect(dialog()?.textContent).toContain('Every session on every device');

    // A sync lands while it is open: the detail follows the live figure.
    await rerender(<StatGrid tiles={tiles('2h 5m')} />);
    expect(dialog()?.querySelector('.MuiTypography-h5')?.textContent).toBe('2h 5m');

    await clickElement(button('Close'));
    expect(dialog()).toBeNull();
  });

  it('closes the detail when its tile is no longer on the grid', async () => {
    await render(<StatGrid tiles={tiles('2h 0m')} />);
    await clickElement(button('Sessions: 4. Open details'));
    expect(dialog()?.textContent).toContain('4 sessions');
    await rerender(<StatGrid tiles={tiles('2h 0m').slice(0, 1)} />);
    expect(dialog()).toBeNull();
  });
});
