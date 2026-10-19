import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationList } from '@/pages/UserDetails/employee-locations/LocationList';
import { renderWithProviders } from '../../../test-utils';
import { MORNING, NOON } from './fixtures';

describe('LocationList', () => {
  it('numbers the pins as the markers are and says why and from what each was taken', () => {
    renderWithProviders(
      <LocationList pins={[MORNING, NOON]} selectedId="pin-2" onSelect={vi.fn()} />,
    );
    const rows = screen.getAllByRole('button');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('1');
    expect(rows[0]).toHaveTextContent('Attendance · Phone GPS');
    expect(rows[1]).toHaveTextContent('2');
    expect(rows[1]).toHaveTextContent('Moved · Computer location');
    expect(rows[1]).toHaveClass('Mui-selected');
    expect(rows[0]).not.toHaveClass('Mui-selected');
  });

  it('selects the pin a row is clicked for', async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <LocationList pins={[MORNING, NOON]} selectedId={null} onSelect={onSelect} />,
    );
    await userEvent.click(screen.getAllByRole('button')[1]);
    expect(onSelect).toHaveBeenCalledWith('pin-2');
  });
});
