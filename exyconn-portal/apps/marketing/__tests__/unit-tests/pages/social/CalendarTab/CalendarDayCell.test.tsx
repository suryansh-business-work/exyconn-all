import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CalendarDay } from '../../../../../src/pages/social/calendar.days';
import type { CalendarPostRow } from '../../../../../src/pages/social/CalendarTab/calendar.status';
import { CalendarDayCell } from '../../../../../src/pages/social/CalendarTab/CalendarDayCell';
import { renderWithProviders } from '../../../test-utils';
import { postRow } from '../../../fixtures';

function dayWith(posts: number, over: Partial<CalendarDay<CalendarPostRow>> = {}) {
  return {
    date: new Date(2026, 8, 20),
    key: '2026-09-20',
    inMonth: true,
    isToday: false,
    isPast: false,
    posts: Array.from({ length: posts }, (_, index) =>
      postRow({ id: `post-${index}`, text: `Post ${index}` }),
    ),
    ...over,
  };
}

const postButtons = () => screen.queryAllByRole('button', { name: /^Edit post/ });

describe('CalendarDayCell', () => {
  it('plans a post on a day from today on, named by its date', async () => {
    const onPlan = vi.fn();
    renderWithProviders(<CalendarDayCell day={dayWith(0)} onPlan={onPlan} onEdit={vi.fn()} />);

    expect(screen.getByText('20')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Schedule a post on 20 Sep 2026' }));

    expect(onPlan).toHaveBeenCalledWith('2026-09-20');
  });

  it('takes no new post on a past day', () => {
    renderWithProviders(
      <CalendarDayCell
        day={dayWith(1, { isPast: true, inMonth: false })}
        onPlan={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /^Schedule a post/ })).not.toBeInTheDocument();
    expect(postButtons()).toHaveLength(1);
  });

  it('shows three posts and folds the rest behind a toggle', async () => {
    renderWithProviders(
      <CalendarDayCell day={dayWith(5, { isToday: true })} onPlan={vi.fn()} onEdit={vi.fn()} />,
    );
    expect(postButtons()).toHaveLength(3);

    const more = screen.getByRole('button', { name: '+2 more' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(more);

    expect(postButtons()).toHaveLength(5);
    const fewer = screen.getByRole('button', { name: 'Show fewer' });
    expect(fewer).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(fewer);
    expect(postButtons()).toHaveLength(3);
  });

  it('needs no toggle for three posts or fewer', () => {
    renderWithProviders(<CalendarDayCell day={dayWith(3)} onPlan={vi.fn()} onEdit={vi.fn()} />);

    expect(postButtons()).toHaveLength(3);
    expect(screen.queryByRole('button', { name: /more$/ })).not.toBeInTheDocument();
  });

  it('opens a post of the day for editing', async () => {
    const onEdit = vi.fn();
    const day = dayWith(1);
    renderWithProviders(<CalendarDayCell day={day} onPlan={vi.fn()} onEdit={onEdit} />);

    await userEvent.click(postButtons()[0]);

    expect(onEdit).toHaveBeenCalledWith(day.posts[0]);
  });
});
