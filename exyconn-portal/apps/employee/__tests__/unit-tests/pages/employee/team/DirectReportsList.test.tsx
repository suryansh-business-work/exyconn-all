import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils';
import { DirectReportsList } from '../../../../../src/pages/employee/team/DirectReportsList';
import { report } from './teamFixtures';

describe('DirectReportsList', () => {
  it('uses the singular for a single report', () => {
    renderWithProviders(<DirectReportsList reports={[report()]} />);

    expect(screen.getByText('Direct reports')).toBeInTheDocument();
    expect(screen.getByText('1 person reports to you.')).toBeInTheDocument();
  });

  it('counts several reports and lists each with role and email', () => {
    renderWithProviders(
      <DirectReportsList
        reports={[
          report(),
          report({
            id: 'emp-2',
            name: 'Vikram Shah',
            email: 'vikram@example.com',
            designation: null,
          }),
        ]}
      />,
    );

    expect(screen.getByText('2 people report to you.')).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('Asha Rao')).toBeInTheDocument();
    expect(within(items[0]).getByText('Engineer · asha@example.com')).toBeInTheDocument();
    // No designation: just the email, with no dangling separator.
    expect(within(items[1]).getByText('vikram@example.com')).toBeInTheDocument();
  });

  it('shows up to two initials, upper-cased, as a decorative avatar', () => {
    renderWithProviders(
      <DirectReportsList
        reports={[report({ id: 'a', name: 'maria de souza' }), report({ id: 'b', name: 'Priya' })]}
      />,
    );

    expect(screen.getByText('MD')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('P')).toBeInTheDocument();
  });

  it('reads zero people in the plural', () => {
    renderWithProviders(<DirectReportsList reports={[]} />);
    expect(screen.getByText('0 people report to you.')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });
});
