import { render } from '@testing-library/react';
import { LoginScene } from '../../../src/Login/LoginScene';

describe('LoginScene', () => {
  it('plays the hero clip silently on a loop, inline on phones', () => {
    const { container } = render(<LoginScene />);
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.getAttribute('src')).toMatch(/login-3d\.mp4$/);
    expect(video).toHaveAttribute('autoplay');
    expect(video).toHaveAttribute('loop');
    expect(video).toHaveAttribute('playsinline');
    expect(video?.muted).toBe(true);
  });
});
