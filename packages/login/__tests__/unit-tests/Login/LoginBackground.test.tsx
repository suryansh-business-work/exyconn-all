import { render } from '@testing-library/react';
import { LoginBackground } from '../../../src/Login/LoginBackground';

/** Every rule emotion has inserted so far, so the computed scrim can be asserted. */
const insertedCss = () =>
  Array.from(document.querySelectorAll('style'))
    .map((style) => style.textContent ?? '')
    .join('\n');

describe('LoginBackground', () => {
  it('shows the artwork as a decorative image under the scrim', () => {
    const { container } = render(
      <LoginBackground imageUrl="/art.jpg" accentColor="#ff0000" isDark={false} />,
    );
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('src', '/art.jpg');
    expect(img).toHaveAttribute('alt', '');
  });

  it('leaves the flat surface when there is no artwork', () => {
    const { container } = render(
      <LoginBackground imageUrl="" accentColor="#ff0000" isDark={false} />,
    );
    expect(container.querySelector('img')).toBeNull();
    // The scrim is still drawn over the flat surface.
    expect(container.firstElementChild?.children).toHaveLength(1);
  });

  it('tints the scrim lighter in light mode and stronger in dark mode', () => {
    render(<LoginBackground imageUrl="" accentColor="#00ff00" isDark={false} />);
    expect(insertedCss()).toContain('rgba(0, 255, 0, 0.35)');
    render(<LoginBackground imageUrl="" accentColor="#0000ff" isDark />);
    expect(insertedCss()).toContain('rgba(0, 0, 255, 0.55)');
  });
});
