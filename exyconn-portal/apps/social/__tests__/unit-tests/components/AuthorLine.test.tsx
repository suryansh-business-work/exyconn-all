import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { AuthorLine } from '../../../src/components/AuthorLine';
import { author } from '../fixtures';

vi.mock(
  '@exyconn/shell/hooks/useSettings',
  async () => (await import('../settings.mock')).settingsMock,
);

const AT = '2026-10-01T09:00:00.000Z';

describe('AuthorLine', () => {
  it('links the name to the author profile and shows role and age', () => {
    renderWithProviders(<AuthorLine author={author()} at={AT} />);

    const link = screen.getByRole('link', { name: 'Asha Rao' });
    expect(link).toHaveAttribute('href', '/social/people/user-1');
    expect(link).toHaveClass('MuiTypography-subtitle2');
    expect(screen.getByText(`Engineer · Platform · relative(${AT})`)).toBeInTheDocument();
  });

  it('shows the initial when there is no avatar picture', () => {
    renderWithProviders(<AuthorLine author={author({ avatarUrl: null })} at={AT} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the avatar picture when there is one', () => {
    renderWithProviders(
      <AuthorLine author={author({ avatarUrl: 'https://cdn.example.com/asha.png' })} at={AT} />,
    );
    expect(screen.getByRole('img', { name: 'Asha Rao' })).toHaveAttribute(
      'src',
      'https://cdn.example.com/asha.png',
    );
  });

  it('prints only the side of the role that exists', () => {
    renderWithProviders(<AuthorLine author={author({ designation: null })} at={AT} />);
    expect(screen.getByText(`Platform · relative(${AT})`)).toBeInTheDocument();
  });

  it('drops the role and its separator when there is no role at all', () => {
    renderWithProviders(
      <AuthorLine author={author({ designation: null, department: '' })} at={AT} />,
    );
    expect(screen.getByText(`relative(${AT})`)).toBeInTheDocument();
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });

  it('uses the smaller name style for a dense byline', () => {
    renderWithProviders(<AuthorLine author={author()} at={AT} dense />);
    expect(screen.getByRole('link', { name: 'Asha Rao' })).toHaveClass('MuiTypography-body2');
  });
});
