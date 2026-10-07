import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Role } from '@/graphql/generated';
import { UserProfileCard } from '@/pages/UserDetails/UserProfileCard';
import { renderWithProviders } from '../../test-utils';
import { makeUserDetail } from './userFixture';

/** The value printed under a fact's label. */
const fact = (label: string) => screen.getByText(label).nextElementSibling?.textContent;

describe('UserProfileCard', () => {
  it('shows identity, presence, status, contact and roles', () => {
    renderWithProviders(
      <UserProfileCard
        user={makeUserDetail({
          isOnline: true,
          roles: [Role.Hr, Role.Employee],
          socialLinks: { github: 'https://github.com/meera' },
        })}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Meera Nair' })).toBeInTheDocument();
    expect(screen.getByText('meera@example.com')).toBeInTheDocument();
    expect(screen.getByText('MN')).toBeInTheDocument();
    expect(screen.getByText('ONLINE')).toBeInTheDocument();
    expect(screen.getAllByText('ACTIVE').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/meera',
    );
    expect(fact('Department')).toBe('Engineering');
    expect(fact('Reports to')).toBe('Ravi Kumar');
    expect(screen.getByRole('link', { name: '+911234567890' })).toHaveAttribute(
      'href',
      'tel:+911234567890',
    );
    expect(screen.getByText('HR')).toBeInTheDocument();
    expect(fact('Joined')).not.toBe('—');
  });

  it('fills the gaps a sparse record leaves with honest placeholders', () => {
    renderWithProviders(
      <UserProfileCard
        user={makeUserDetail({
          department: null,
          designation: null,
          managerName: null,
          joinDate: null,
          phone: null,
        })}
      />,
    );

    expect(fact('Department')).toBe('—');
    expect(fact('Designation')).toBe('—');
    expect(fact('Reports to')).toBe('—');
    expect(fact('Joined')).toBe('—');
    expect(fact('Phone')).toBe('—');
    expect(fact('Probation ends')).toBe('Not on probation');
    expect(fact('Last active')).toBe('Never');
    expect(screen.getByText('OFFLINE')).toBeInTheDocument();
    expect(screen.queryByText('Block reason')).toBeNull();
  });

  it('dates probation and last activity when they are known', () => {
    renderWithProviders(
      <UserProfileCard
        user={makeUserDetail({
          probationEndDate: '2026-07-15T00:00:00.000Z',
          lastActiveAt: '2026-05-01T10:00:00.000Z',
          avatarUrl: 'https://cdn.example.com/meera.png',
        })}
      />,
    );

    expect(fact('Probation ends')).not.toBe('Not on probation');
    expect(fact('Probation ends')).toMatch(/2026/);
    expect(fact('Last active')).toMatch(/2026/);
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      'https://cdn.example.com/meera.png',
    );
  });

  it('shows why a blocked user was blocked', () => {
    renderWithProviders(
      <UserProfileCard user={makeUserDetail({ isBlocked: true, blockReason: 'Lost laptop' })} />,
    );
    expect(screen.getByText('BLOCKED')).toBeInTheDocument();
    expect(fact('Block reason')).toBe('Lost laptop');
  });

  it('hides the block reason when none was given', () => {
    renderWithProviders(<UserProfileCard user={makeUserDetail({ isBlocked: true })} />);
    expect(screen.queryByText('Block reason')).toBeNull();
  });
});
