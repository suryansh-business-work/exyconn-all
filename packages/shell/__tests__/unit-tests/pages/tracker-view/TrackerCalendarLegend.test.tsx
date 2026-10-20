import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
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
  it('lists all six statuses in order, each with its meaning and icon', () => {
    renderWithProviders(<TrackerCalendarLegend />);

    const list = screen.getByRole('list', { name: 'Calendar legend' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(LEGEND.length);
    items.forEach((item, index) => {
      const [word, meaning] = LEGEND[index];
      expect(within(item).getByText(word)).toBeInTheDocument();
      expect(within(item).getByText(meaning)).toBeInTheDocument();
      expect(item.querySelector('[aria-hidden] svg')).toBeInTheDocument();
    });
  });

  it('translates the words and meanings', () => {
    renderWithProviders(<TrackerCalendarLegend />, {
      messages: { 'Calendar legend': 'Leyenda', Holiday: 'Festivo', 'Official holiday': 'Oficial' },
    });

    expect(screen.getByRole('list', { name: 'Leyenda' })).toBeInTheDocument();
    expect(screen.getByText('Festivo')).toBeInTheDocument();
    expect(screen.getByText('Oficial')).toBeInTheDocument();
  });
});
