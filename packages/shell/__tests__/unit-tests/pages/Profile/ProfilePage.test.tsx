import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Role } from '@/graphql/generated';
import { ProfilePage } from '@/pages/Profile';
import { ProfileSummaryCard } from '@/pages/Profile/ProfileSummaryCard';
import { makeUser, renderWithProviders } from '../../test-utils';
import { me, meAnswer } from './meFixture';

describe('the profile page', () => {
  it('draws nothing for somebody signed out', () => {
    const { container } = renderWithProviders(<ProfilePage />, { user: null });

    expect(container).toBeEmptyDOMElement();
  });

  it('shows how colleagues see you beside what you can change', async () => {
    renderWithProviders(<ProfilePage />, {
      user: makeUser({ roles: ['EMPLOYEE', 'HR'] }),
      mocks: [meAnswer({ roles: [Role.Employee, Role.Hr] }).mock],
    });

    expect(screen.getByRole('heading', { level: 1, name: 'My Profile' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Personal details' })).toBeInTheDocument();
    expect(await screen.findByText('Staff Engineer · Engineering')).toBeInTheDocument();
    expect(screen.getByText('EMPLOYEE')).toBeInTheDocument();
    expect(screen.getByText('HR')).toBeInTheDocument();
  });
});

function showCard(profile: ReturnType<typeof me> | undefined) {
  return renderWithProviders(
    <ProfileSummaryCard
      name="Asha Rao"
      email="asha@example.com"
      roles={['EMPLOYEE']}
      me={profile}
    />,
    { user: makeUser() },
  );
}

describe('the profile summary card', () => {
  it('shows the role, the bio and the presence the profile carries', () => {
    showCard(me({ isOnline: false, brief: 'Builds the payroll engine.' }));

    expect(screen.getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByText('Staff Engineer · Engineering')).toBeInTheDocument();
    expect(screen.getByText('Builds the payroll engine.')).toBeInTheDocument();
    expect(screen.getByLabelText('Offline')).toBeInTheDocument();
    expect(screen.getByText('OFFLINE')).toBeInTheDocument();
  });

  it('leaves out a role nobody has set, and a missing half of one', () => {
    showCard(me({ designation: null, department: 'Engineering', brief: null }));

    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    expect(screen.queryByText('Builds the payroll engine.')).not.toBeInTheDocument();
  });

  it('counts somebody as online until the profile says otherwise', () => {
    showCard(undefined);

    expect(screen.getByLabelText('Online')).toBeInTheDocument();
    expect(screen.getByText('ONLINE')).toBeInTheDocument();
    expect(screen.getByText('asha@example.com')).toBeInTheDocument();
    const chips = screen.getByText('Roles').nextElementSibling as HTMLElement;
    expect(within(chips).getByText('EMPLOYEE')).toBeInTheDocument();
  });
});
