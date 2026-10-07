import { describe, expect, it } from 'vitest';
import { Ground } from '../../../../src/components/ui/Ground';
import { brandColors } from '../../../../src/theme/brand';
import { renderWithProviders } from '../../test-utils';

describe('Ground', () => {
  it("paints the theme's plain app colour when the background is solid", () => {
    const { container } = renderWithProviders(<Ground />, { groundOpacity: 1 });
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('lets the brand gradient show through as far as the opacity leaves room for', () => {
    const brand = brandColors(null, 'light');
    const { container } = renderWithProviders(<Ground />, { groundOpacity: 0.4 });
    const stops = container.querySelectorAll('stop');
    expect(stops).toHaveLength(2);
    expect(stops[0]).toHaveAttribute('stop-color', brand.primary);
    expect(stops[1]).toHaveAttribute('stop-color', brand.secondary);
    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(3);
    expect(rects[1]).toHaveAttribute('fill', 'url(#ground)');
    expect(rects[2]).toHaveAttribute('opacity', '0.4');
  });
});
