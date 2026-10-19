import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeColumn } from '../../../../src/pages/book/TimeColumn';
import { renderWithProviders } from '../../test-utils';

const slots = ['2026-10-14T09:00:00.000Z', '2026-10-14T10:00:00.000Z'];
const label = (slot: string) => `at ${slot.slice(11, 16)}`;

function renderColumn(selected: string | null, times: string[] = slots) {
  const onSelect = vi.fn();
  const onNext = vi.fn();
  renderWithProviders(
    <TimeColumn
      title="Wednesday, October 14"
      slots={times}
      selected={selected}
      label={label}
      onSelect={onSelect}
      onNext={onNext}
    />,
  );
  return { onSelect, onNext };
}

function times() {
  return within(screen.getByRole('group', { name: 'Free times' }));
}

describe('TimeColumn', () => {
  it('lists the day’s free times under its title, with no Next until one is chosen', () => {
    renderColumn(null);

    expect(screen.getByText('Wednesday, October 14')).toBeInTheDocument();
    expect(times().getAllByRole('button').map((b) => b.textContent)).toEqual([
      'at 09:00',
      'at 10:00',
    ]);
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('chooses a time when it is pressed', async () => {
    const { onSelect } = renderColumn(null);

    await userEvent.click(times().getByRole('button', { name: 'at 10:00' }));

    expect(onSelect).toHaveBeenCalledWith('2026-10-14T10:00:00.000Z');
  });

  it('marks the chosen time pressed and moves on with it from Next', async () => {
    const { onNext, onSelect } = renderColumn(slots[1]);

    expect(times().getByRole('button', { name: 'at 10:00' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await userEvent.click(times().getByRole('button', { name: 'Next' }));

    expect(onNext).toHaveBeenCalledWith('2026-10-14T10:00:00.000Z');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('says when the day has no free times', () => {
    renderColumn(null, []);

    expect(screen.getByText('No free times that day.')).toBeInTheDocument();
    expect(times().queryAllByRole('button')).toHaveLength(0);
  });
});
