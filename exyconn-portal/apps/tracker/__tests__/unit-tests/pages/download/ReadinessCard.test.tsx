import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ReadinessCard } from '../../../../src/pages/download/ReadinessCard';
import { renderWithProviders } from '../../test-utils';

describe('ReadinessCard', () => {
  it('lists the three checks in the order an employee completes them', () => {
    renderWithProviders(<ReadinessCard hasAccess={false} consented={false} loading={false} />);

    expect(screen.getByText('Before you start')).toBeInTheDocument();
    const labels = screen
      .getAllByText(/^(Tracker access granted|App installed and signed in|Consent accepted)$/)
      .map((node) => node.textContent);
    expect(labels).toEqual([
      'Tracker access granted',
      'App installed and signed in',
      'Consent accepted',
    ]);
  });

  it('tells an employee without access or consent what is still missing', () => {
    renderWithProviders(<ReadinessCard hasAccess={false} consented={false} loading={false} />);

    expect(
      screen.getByText(
        'Ask your manager to grant access — the app will refuse to sign you in until they do.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The app shows a consent screen on first run; nothing is recorded until you accept it.',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('PendingIcon')).toHaveLength(3);
    expect(screen.queryByTestId('CheckCircleIcon')).toBeNull();
  });

  it('ticks access and consent once both are in place, the install step stays open', () => {
    renderWithProviders(<ReadinessCard hasAccess consented loading={false} />);

    expect(screen.getByText('Your account may run the tracker.')).toBeInTheDocument();
    expect(screen.getByText('You have accepted what the app records.')).toBeInTheDocument();
    expect(
      screen.getByText('Sign in with the same email and password you use for this portal.'),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('CheckCircleIcon')).toHaveLength(2);
    expect(screen.getAllByTestId('PendingIcon')).toHaveLength(1);
  });

  it('shows a checking chip only while the access row is loading', () => {
    const { rerender } = renderWithProviders(
      <ReadinessCard hasAccess={false} consented={false} loading />,
    );
    expect(screen.getByText('Checking…')).toBeInTheDocument();

    rerender(<ReadinessCard hasAccess={false} consented={false} loading={false} />);
    expect(screen.queryByText('Checking…')).toBeNull();
  });
});
