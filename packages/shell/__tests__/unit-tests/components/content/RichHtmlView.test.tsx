import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { RichHtmlView } from '@/components/content/RichHtmlView';
import { renderWithProviders } from '../../test-utils';

describe('RichHtmlView', () => {
  it('shows the text in a named, focusable region with scripts stripped', () => {
    renderWithProviders(
      <RichHtmlView html={'<p>Terms</p><script>alert(1)</script>'} label="Document text" />,
    );
    const region = screen.getByRole('region', { name: 'Document text' });

    expect(region).toHaveTextContent('Terms');
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.querySelector('script')).toBeNull();
  });
});
