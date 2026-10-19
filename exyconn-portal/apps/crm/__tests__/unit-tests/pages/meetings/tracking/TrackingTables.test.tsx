import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import {
  conversion,
  TrackingTables,
} from '../../../../../src/pages/meetings/tracking/TrackingTables';
import { renderWithProviders } from '../../../test-utils';
import { trackingData } from '../meetings-fixtures';

const titles = new Map([['intro-call', 'Intro call']]);

/** The rows of the table under the heading `title`, each as its cells' text. */
function tableRows(title: string) {
  const section = screen.getByRole('heading', { name: title }).parentElement;
  if (!section) throw new Error(`No section ${title}`);
  return within(section)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    );
}

describe('conversion', () => {
  it('rounds the share of views that booked to a whole percent', () => {
    expect(conversion(3, 1)).toBe('33%');
    expect(conversion(8, 8)).toBe('100%');
    expect(conversion(5, 0)).toBe('0%');
  });

  it('reads a dash when nobody looked', () => {
    expect(conversion(0, 0)).toBe('–');
  });
});

describe('TrackingTables', () => {
  it('counts by country, with a nameless country as Unknown', () => {
    renderWithProviders(<TrackingTables tracking={trackingData()} titles={titles} loading={false} />);

    expect(tableRows('By country')).toEqual([
      ['United Kingdom', '6', '2', '33%'],
      ['Unknown', '2', '0', '0%'],
    ]);
  });

  it('counts by meeting: the page itself, a known title, and a link with no title', () => {
    renderWithProviders(<TrackingTables tracking={trackingData()} titles={titles} loading={false} />);

    expect(tableRows('By meeting')).toEqual([
      ['Booking page', '3', '0', '0%'],
      ['Intro call', '4', '2', '50%'],
      ['retired', '1', '0', '0%'],
    ]);
  });

  it('lists the latest visits one by one in the portal’s date format', () => {
    renderWithProviders(<TrackingTables tracking={trackingData()} titles={titles} loading={false} />);

    expect(tableRows('Latest visits')).toEqual([
      ['18 Oct 2026 09:30 AM', 'VIEW', 'Intro call', 'United Kingdom'],
      ['18 Oct 2026 08:00 AM', 'VIEW', 'Booking page', 'Unknown'],
    ]);
  });

  it('says there are no visits yet when nothing has loaded', () => {
    renderWithProviders(<TrackingTables titles={titles} loading={false} />);

    expect(screen.getAllByText('No visits yet.')).toHaveLength(3);
  });

  it('marks every table busy while loading', () => {
    renderWithProviders(<TrackingTables titles={titles} loading />);

    expect(screen.queryByText('No visits yet.')).not.toBeInTheDocument();
    expect(document.querySelectorAll('[aria-busy="true"]')).toHaveLength(3);
  });
});
