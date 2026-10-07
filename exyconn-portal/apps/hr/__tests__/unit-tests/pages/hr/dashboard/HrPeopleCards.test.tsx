import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { HrAnniversaries } from '../../../../../src/pages/hr/dashboard/HrAnniversaries';
import { HrBirthdays } from '../../../../../src/pages/hr/dashboard/HrBirthdays';
import { HrNewJoiners } from '../../../../../src/pages/hr/dashboard/HrNewJoiners';
import { renderWithProviders } from '../../../test-utils';

const person = (id: string, name: string) => ({ id, name, isActive: true });
const day = (iso: string) => new Date(iso);
const shortDate = (value: Date) => value.toISOString().slice(0, 10);

describe('HrAnniversaries', () => {
  it('shows a spinner while the people load', () => {
    renderWithProviders(<HrAnniversaries anniversaries={[]} formatDate={shortDate} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('None in the next 30 days.')).not.toBeInTheDocument();
  });

  it('says so when nobody has an anniversary coming up', () => {
    renderWithProviders(<HrAnniversaries anniversaries={[]} formatDate={shortDate} />);
    expect(screen.getByText('None in the next 30 days.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('counts the years in whole sentences and says when each falls', () => {
    renderWithProviders(
      <HrAnniversaries
        formatDate={shortDate}
        anniversaries={[
          { user: person('a', 'Asha'), on: day('2026-03-15T00:00:00Z'), daysAway: 0, years: 1 },
          { user: person('b', 'Bilal'), on: day('2026-03-16T00:00:00Z'), daysAway: 1, years: 2 },
          { user: person('c', 'Chen'), on: day('2026-03-20T00:00:00Z'), daysAway: 5, years: 7 },
        ]}
      />,
    );
    expect(screen.getByText('Asha · 1 year')).toBeInTheDocument();
    expect(screen.getByText('Today · 2026-03-15')).toBeInTheDocument();
    expect(screen.getByText('Bilal · 2 years')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow · 2026-03-16')).toBeInTheDocument();
    expect(screen.getByText('Chen · 7 years')).toBeInTheDocument();
    expect(screen.getByText('In 5 days · 2026-03-20')).toBeInTheDocument();
  });
});

describe('HrBirthdays', () => {
  it('shows a spinner while the people load', () => {
    renderWithProviders(<HrBirthdays birthdays={[]} formatDate={shortDate} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('says so when no birthday is coming up', () => {
    renderWithProviders(<HrBirthdays birthdays={[]} formatDate={shortDate} />);
    expect(screen.getByText('None in the next 30 days.')).toBeInTheDocument();
  });

  it('lists who, and when, without a year of birth', () => {
    renderWithProviders(
      <HrBirthdays
        formatDate={shortDate}
        birthdays={[
          { user: person('a', 'Asha'), on: day('2026-03-15T00:00:00Z'), daysAway: 0 },
          { user: person('b', 'Bilal'), on: day('2026-03-16T00:00:00Z'), daysAway: 1 },
          { user: person('c', 'Chen'), on: day('2026-04-01T00:00:00Z'), daysAway: 17 },
        ]}
      />,
    );
    expect(screen.getByText('Asha')).toBeInTheDocument();
    expect(screen.getByText('Today · 2026-03-15')).toBeInTheDocument();
    expect(screen.getByText('Tomorrow · 2026-03-16')).toBeInTheDocument();
    expect(screen.getByText('In 17 days · 2026-04-01')).toBeInTheDocument();
  });
});

describe('HrNewJoiners', () => {
  it('shows a spinner while the people load', () => {
    renderWithProviders(<HrNewJoiners users={[]} formatDate={(v) => v} loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('No one joined this month.')).not.toBeInTheDocument();
  });

  it('says so when nobody joined', () => {
    renderWithProviders(<HrNewJoiners users={[]} formatDate={(v) => v} />);
    expect(screen.getByText('No one joined this month.')).toBeInTheDocument();
  });

  it('lists each joiner with their date, or a dash without one', () => {
    renderWithProviders(
      <HrNewJoiners
        formatDate={(v) => `joined ${v}`}
        users={[
          { ...person('a', 'Asha'), joinDate: '2026-03-02' },
          { ...person('b', 'Bilal'), joinDate: null },
        ]}
      />,
    );
    expect(screen.getByText('joined 2026-03-02')).toBeInTheDocument();
    expect(screen.getByText('Bilal').nextElementSibling).toHaveTextContent('—');
  });
});
