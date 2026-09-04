import { isPexelsMediaUrl } from '../../src/utils/pexels';

describe('isPexelsMediaUrl', () => {
  it('accepts an https Pexels CDN URL', () => {
    expect(isPexelsMediaUrl('https://videos.pexels.com/video-files/123/456.mp4')).toBe(true);
    expect(isPexelsMediaUrl('https://images.pexels.com/photos/1/pexels-photo-1.jpeg')).toBe(true);
  });

  it('rejects any other host, so the import cannot be pointed at an internal service', () => {
    expect(isPexelsMediaUrl('https://evil.example.com/payload.mp4')).toBe(false);
    expect(isPexelsMediaUrl('https://pexels.com.evil.example/payload.mp4')).toBe(false);
  });

  it('rejects non-https schemes and anything unparseable', () => {
    expect(isPexelsMediaUrl('http://images.pexels.com/photos/1.jpeg')).toBe(false);
    expect(isPexelsMediaUrl('file:///etc/passwd')).toBe(false);
    expect(isPexelsMediaUrl('not a url')).toBe(false);
  });
});
