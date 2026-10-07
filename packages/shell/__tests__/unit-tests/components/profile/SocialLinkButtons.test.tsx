import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { SOCIAL_NETWORKS, SocialLinkButtons } from '@/components/profile/SocialLinkButtons';
import { renderWithProviders } from '../../test-utils';

describe('SocialLinkButtons', () => {
  it('links each network the person shared, in the fixed order, opening safely in a new tab', () => {
    renderWithProviders(
      <SocialLinkButtons
        links={{
          website: 'https://asha.dev',
          github: 'https://github.com/asha',
          linkedin: null,
          twitter: '',
        }}
      />,
      { messages: { Website: 'Sitio web' } },
    );

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual(['GitHub', 'Sitio web']);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/asha');
    expect(links[1]).toHaveAttribute('target', '_blank');
    expect(links[1]).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders nothing when no link was shared', () => {
    const { container, rerender } = renderWithProviders(<SocialLinkButtons links={null} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<SocialLinkButtons links={{ linkedin: '', github: null }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists the four networks a profile can link to', () => {
    expect(SOCIAL_NETWORKS.map((network) => network.key)).toEqual([
      'linkedin',
      'github',
      'twitter',
      'website',
    ]);
  });

  it('can centre the row', () => {
    renderWithProviders(
      <SocialLinkButtons
        links={{ linkedin: 'https://linkedin.com/in/asha' }}
        justifyContent="center"
      />,
    );

    expect(screen.getByRole('link', { name: 'LinkedIn' }).parentElement).toHaveStyle({
      justifyContent: 'center',
    });
  });
});
