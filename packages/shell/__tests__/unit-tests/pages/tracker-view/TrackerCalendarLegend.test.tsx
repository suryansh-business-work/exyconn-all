import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackerCalendarLegend } from '@/pages/tracker-view/TrackerCalendarLegend';
import { renderWithProviders } from '../../test-utils';

const LEGEND = [
  ['Completed', 'Working hours completed'],
  ['Short', 'Less than the expected working hours'],
  ['Leave', 'Approved leave (e.g. SL, EL)'],
  ['Holiday', 'Official holiday'],
  ['Week off', 'Scheduled weekly off'],
  ['Off Computer Work', 'Approved work done away from the computer'],
] as const;

describe('TrackerCalendarLegend', () => {
  it('lists all six statuses in order, each with its icon and an info button', () => {
    renderWithProviders(<TrackerCalendarLegend />);

    const list = screen.getByRole('list', { name: 'Calendar legend' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(LEGEND.length);
    items.forEach((item, index) => {
      const [word, meaning] = LEGEND[index];
      expect(within(item).getByText(word)).toBeInTheDocument();
      expect(within(item).getByRole('button', { name: `What ${word} means` })).toBeInTheDocument();
      // The meaning waits in the tooltip, not on the tile.
      expect(within(item).queryByText(meaning)).toBeNull();
      expect(item.querySelector('[aria-hidden] svg')).toBeInTheDocument();
    });
  });

  it('explains a mark on hover and describes the button with it', async () => {
    renderWithProviders(<TrackerCalendarLegend />);
    const info = screen.getByRole('button', { name: 'What Short means' });

    await userEvent.hover(info);

    const tip = await screen.findByRole('tooltip');
    expect(tip).toHaveTextContent('Less than the expected working hours');
    expect(info).toHaveAccessibleDescription('Less than the expected working hours');
  });

  it('explains a mark when its button takes keyboard focus', async () => {
    renderWithProviders(<TrackerCalendarLegend />);

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'What Completed means' })).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Working hours completed');
  });

  it('translates the words and meanings', async () => {
    renderWithProviders(<TrackerCalendarLegend />, {
      messages: {
        'Calendar legend': 'Leyenda',
        Holiday: 'Festivo',
        'Official holiday': 'Oficial',
        'What {mark} means': 'Qué significa {mark}',
      },
    });

    expect(screen.getByRole('list', { name: 'Leyenda' })).toBeInTheDocument();
    expect(screen.getByText('Festivo')).toBeInTheDocument();
    const info = screen.getByRole('button', { name: 'Qué significa Festivo' });
    await userEvent.hover(info);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Oficial');
  });
});
