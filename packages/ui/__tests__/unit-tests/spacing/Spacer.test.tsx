import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Spacer, space, type SpaceSize } from '../../../src/spacing';

function spacerOf(container: HTMLElement): HTMLElement {
  return container.firstElementChild as HTMLElement;
}

describe('Spacer', () => {
  it('is a medium vertical gap by default that never shrinks', () => {
    const { container } = render(<Spacer />);
    const box = spacerOf(container);
    expect(box).toHaveStyle({ height: `${space.md}px`, flexShrink: '0' });
    expect(box.style.width).toBe('');
    expect(getComputedStyle(box).width).not.toBe(`${space.md}px`);
  });

  it.each<SpaceSize>(['xs', 'sm', 'lg', 'xl'])('takes the %s step as its height', (size) => {
    const { container } = render(<Spacer size={size} />);
    expect(spacerOf(container)).toHaveStyle({ height: `${space[size]}px` });
  });

  it('becomes a width when horizontal', () => {
    const { container } = render(<Spacer size="lg" axis="horizontal" />);
    const box = spacerOf(container);
    expect(box).toHaveStyle({ width: `${space.lg}px`, flexShrink: '0' });
    expect(getComputedStyle(box).height).not.toBe(`${space.lg}px`);
  });
});
