import { NETWORK_RULES, ruleProblem } from '../../../../src/modules/social-accounts/social.rules';

const draft = (over: Partial<{ text: string; mediaUrl: string; link: string }> = {}) => ({
  text: 'Hello',
  mediaUrl: '',
  link: '',
  ...over,
});

describe('network rules', () => {
  it('counts a link already in the text only once', () => {
    const link = 'https://exyconn.com/a';
    const text = `${'x'.repeat(280 - link.length - 1)} ${link}`;
    expect(text).toHaveLength(280);
    expect(ruleProblem('X', draft({ text, link }))).toBeNull();
  });

  it('takes an image-only post where images are allowed', () => {
    expect(ruleProblem('FACEBOOK', draft({ text: '', mediaUrl: 'https://i/a.png' }))).toBeNull();
    expect(ruleProblem('INSTAGRAM', draft({ mediaUrl: 'https://i/a.png' }))).toBeNull();
  });

  it('refuses an image on LinkedIn and an empty post anywhere', () => {
    expect(ruleProblem('LINKEDIN', draft({ mediaUrl: 'https://i/a.png' }))).toBe(
      'LINKEDIN posts from here cannot carry an image.',
    );
    expect(ruleProblem('THREADS', draft({ text: '   ' }))).toBe(
      'Write something, or add an image.',
    );
  });

  it('describes every network the composer offers', () => {
    expect(Object.values(NETWORK_RULES).filter((rule) => !rule.canPublish)).toEqual([
      expect.objectContaining({ network: 'YOUTUBE', maxChars: 0 }),
    ]);
  });
});
