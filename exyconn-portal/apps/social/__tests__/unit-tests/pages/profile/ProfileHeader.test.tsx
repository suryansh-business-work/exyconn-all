import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils';
import { ProfileHeader } from '../../../../src/pages/profile/ProfileHeader';
import { author, profile } from '../../fixtures';

vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../../settings.mock')).settingsMock,
);

describe('ProfileHeader', () => {
  it('shows who the colleague is, when they joined and what the feed has seen of them', () => {
    renderWithProviders(<ProfileHeader profile={profile()} />);
    expect(screen.getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
    expect(screen.getByText('Engineer · Platform')).toBeInTheDocument();
    expect(screen.getByText('asha@example.com')).toBeInTheDocument();
    expect(screen.getByText('Joined date(2024-04-01)')).toBeInTheDocument();
    expect(screen.getByText('4 posts')).toBeInTheDocument();
    expect(screen.getByText('12 likes received')).toBeInTheDocument();
    expect(screen.getByText('Builds the payroll engine.')).toBeInTheDocument();
  });

  it('uses the singular sentences for exactly one post and one like', () => {
    renderWithProviders(<ProfileHeader profile={profile({ postCount: 1, likesReceived: 1 })} />);
    expect(screen.getByText('1 post')).toBeInTheDocument();
    expect(screen.getByText('1 like received')).toBeInTheDocument();
  });

  it('uses the plural sentences for none', () => {
    renderWithProviders(<ProfileHeader profile={profile({ postCount: 0, likesReceived: 0 })} />);
    expect(screen.getByText('0 posts')).toBeInTheDocument();
    expect(screen.getByText('0 likes received')).toBeInTheDocument();
  });

  it('leaves out the role, join date and brief when the directory has none', () => {
    renderWithProviders(
      <ProfileHeader
        profile={profile({
          brief: null,
          joinDate: null,
          user: author({ designation: null, department: null }),
        })}
      />,
    );
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Joined/)).not.toBeInTheDocument();
    expect(screen.queryByText('Builds the payroll engine.')).not.toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows the profile picture when there is one', () => {
    renderWithProviders(
      <ProfileHeader
        profile={profile({ user: author({ avatarUrl: 'https://cdn.example.com/asha.png' }) })}
      />,
    );
    expect(screen.getByRole('img', { name: 'Asha Rao' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/asha.png',
    );
  });

  it('translates each count as a whole sentence', () => {
    renderWithProviders(<ProfileHeader profile={profile({ postCount: 1 })} />, {
      messages: { '1 post': 'Ein Beitrag', '{count} likes received': '{count} Likes erhalten' },
    });
    expect(screen.getByText('Ein Beitrag')).toBeInTheDocument();
    expect(screen.getByText('12 Likes erhalten')).toBeInTheDocument();
  });
});
