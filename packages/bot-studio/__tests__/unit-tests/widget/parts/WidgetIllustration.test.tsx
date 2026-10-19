import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { WidgetIllustration } from '../../../../src/widget/parts/WidgetIllustration';
import { renderWithProviders } from '../../test-utils';

describe('WidgetIllustration', () => {
  it('names the artwork by its title and shows title and subtitle on the accent tint', () => {
    renderWithProviders(
      <WidgetIllustration
        image={{ icon: 'bag', accent: 'blue', title: 'Summer sale', subtitle: 'Up to 40% off' }}
        height={120}
      />,
    );
    const art = screen.getByRole('img', { name: 'Summer sale' });
    expect(art).toHaveStyle({ height: '120px', backgroundColor: 'rgb(43, 125, 233)' });
    expect(screen.getByText('Summer sale')).toBeInTheDocument();
    expect(screen.getByText('Up to 40% off')).toBeInTheDocument();
  });

  it('falls back to the icon name and draws only the icon without any text', () => {
    renderWithProviders(<WidgetIllustration image={{ icon: 'info', accent: 'teal' }} />);
    const art = screen.getByRole('img', { name: 'info' });
    expect(art).toHaveStyle({ height: '96px' });
    expect(art.childElementCount).toBe(1);
  });

  it('shows a subtitle alone when there is no title', () => {
    renderWithProviders(
      <WidgetIllustration image={{ icon: 'info', accent: 'teal', subtitle: 'Open daily' }} />,
    );
    expect(screen.getByRole('img', { name: 'info' })).toHaveTextContent('Open daily');
  });
});
