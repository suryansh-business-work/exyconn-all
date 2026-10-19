import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarPage } from '../../../../src/pages/calendar';
import { renderWithProviders, useCurrentUrl } from '../../test-utils';
import { answered, pending } from '../../fixtures';
import { calendarItem } from './calendar.fixtures';

const hook = vi.hoisted(() => ({ answer: null as unknown, variables: null as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCrmCalendarQuery: (options: { variables: unknown }) => {
    hook.variables = options.variables;
    return hook.answer;
  },
}));

function UrlProbe() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const renderPage = (route = '/calendar?view=week&date=2026-10-19') =>
  renderWithProviders(
    <>
      <CalendarPage />
      <UrlProbe />
    </>,
    { route },
  );

beforeEach(() => {
  hook.answer = answered({ crmCalendar: [calendarItem()] });
});

describe('CRM calendar', () => {
  it('shows each entry on its day and opens its record when clicked', async () => {
    renderPage();

    const entry = screen.getByRole('button', { name: /^Reminder: .*Call Ravi$/ });
    expect(screen.getByText('Ravi · Asha')).toBeInTheDocument();
    await userEvent.click(entry);

    expect(screen.getByLabelText('url')).toHaveTextContent('/contacts/c1');
  });

  it('keeps the view and the day in the address as you move around', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('view=week&date=2026-10-26');

    await userEvent.click(screen.getByRole('button', { name: 'Day' }));
    expect(screen.getByLabelText('url')).toHaveTextContent('view=day&date=2026-10-26');
  });

  it('shows a placeholder while loading and a sentence when the period is empty', () => {
    hook.answer = pending();
    const { unmount } = renderPage();
    expect(screen.getByText('Loading calendar')).toBeInTheDocument();
    unmount();

    hook.answer = answered({ crmCalendar: [] });
    renderPage();
    expect(
      screen.getByText(
        'Nothing scheduled in this period. Add a reminder from a contact or company page.',
      ),
    ).toBeInTheDocument();
  });

  it('says when the calendar failed and offers to try again', async () => {
    const refetch = vi.fn().mockResolvedValue({});
    hook.answer = { data: undefined, loading: false, error: new Error('Network down'), refetch };
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByText('Network down')).toBeInTheDocument();
    expect(refetch).toHaveBeenCalled();
  });

  it('draws the month with weekday headings', () => {
    renderPage('/calendar?view=month&date=2026-10-19');

    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Call Ravi/ })).toBeInTheDocument();
  });
});
