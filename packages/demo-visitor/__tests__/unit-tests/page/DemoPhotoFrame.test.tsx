import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { DemoPhotoFrame } from '../../../src/page/DemoPhotoFrame';
import { renderWithProviders } from '../test-utils';

const photo = {
  src: '/team.jpg',
  alt: 'A team at work',
  sourceUrl: 'https://www.pexels.com/photo/1/',
};

describe('DemoPhotoFrame', () => {
  it('waits to load until near by default and credits Pexels', () => {
    renderWithProviders(<DemoPhotoFrame photo={photo} />, {
      messages: { 'A team at work': 'Un equipo trabajando' },
    });
    const image = screen.getByRole('img', { name: 'Un equipo trabajando' });
    expect(image).toHaveAttribute('src', '/team.jpg');
    expect(image).toHaveAttribute('loading', 'lazy');
    const credit = screen.getByRole('link', { name: 'Pexels' });
    expect(credit).toHaveAttribute('href', 'https://www.pexels.com/photo/1/');
    expect(credit).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByRole('figure')).toHaveTextContent('Photo: Pexels');
  });

  it('loads at once when it is the first photo on the page', () => {
    renderWithProviders(<DemoPhotoFrame photo={photo} ratio={16 / 9} eager />);
    expect(screen.getByRole('img', { name: 'A team at work' })).toHaveAttribute('loading', 'eager');
  });
});
