import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { EmployeeContactFacts } from '@/pages/UserDetails/EmployeeContactFacts';
import { renderWithProviders } from '../../test-utils';
import { makeUserDetail } from './userFixture';

/** The value printed under a fact's label. */
const fact = (label: string) => screen.getByText(label).nextElementSibling as HTMLElement;

describe('EmployeeContactFacts', () => {
  it('shows both addresses, each saying whether a code has proven it', () => {
    renderWithProviders(
      <EmployeeContactFacts
        user={makeUserDetail({
          emailVerifiedAt: '2026-06-01T10:00:00.000Z',
          personalEmail: 'meera@home.test',
          personalEmailVerifiedAt: null,
          workDays: [1, 2, 3],
          effectiveWorkDays: [1, 2, 3],
        })}
      />,
    );
    const official = fact('Official email');
    expect(within(official).getByRole('link', { name: 'meera@example.com' })).toHaveAttribute(
      'href',
      'mailto:meera@example.com',
    );
    expect(official).toHaveTextContent('Verified');
    const personal = fact('Personal email');
    expect(within(personal).getByRole('link', { name: 'meera@home.test' })).toBeInTheDocument();
    expect(personal).toHaveTextContent('Unverified');
    // Their own week, not the company's.
    expect(fact('Work days')).toHaveTextContent('MonTueWedOwn week');
  });

  it("shows a dash for no personal address and the company's week when none is set", () => {
    renderWithProviders(
      <EmployeeContactFacts
        user={makeUserDetail({ personalEmail: null, workDays: [], effectiveWorkDays: [1, 5] })}
      />,
    );
    expect(fact('Official email')).toHaveTextContent('Unverified');
    expect(fact('Personal email')).toHaveTextContent('—');
    expect(fact('Work days')).toHaveTextContent('MonFriCompany week');
  });
});
